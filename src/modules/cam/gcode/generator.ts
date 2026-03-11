import type { SketchDocument } from "@/features/cad-editor/model/types";
import {
  emitCutEnd,
  emitCutStart,
  emitMoveTo,
  emitProgramPostamble,
  emitProgramPreamble,
  emitToolEnd,
  emitToolStart,
} from "./emitters";
import { fmt } from "./format";
import { planDocumentToolpaths } from "../planning/documentPlanner";
import { generateRampingPass } from "../algorithms/ramping";
import {
  buildBridgeSpans,
  contourLength,
  isInsideAnyBridge,
  pointAtLength,
} from "../algorithms/bridges";
import type { Toolpath, ToolpathPoint } from "@/types";

const EPS = 1e-6;

function to2D(points: ToolpathPoint[]) {
  return points.map((p) => ({ x: p.x, y: p.y }));
}

function is3DPath(points: ToolpathPoint[]): boolean {
  return points.some((point) => typeof point.z === "number");
}

function buildDepthPasses(targetCutZ: number, passDepth: number): number[] {
  if (targetCutZ >= 0) return [targetCutZ];

  const step = Math.max(0.001, Math.abs(passDepth));
  const passes: number[] = [];

  let current = -step;
  while (current > targetCutZ) {
    passes.push(Number(current.toFixed(3)));
    current -= step;
  }

  passes.push(Number(targetCutZ.toFixed(3)));
  return passes;
}

function emitLinearPath(points: ToolpathPoint[], feed: number): string[] {
  const lines: string[] = [];
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const xPart = `X${fmt(point.x)}`;
    const yPart = `Y${fmt(point.y)}`;
    const zPart = typeof point.z === "number" ? ` Z${fmt(point.z)}` : "";
    lines.push(`G1 ${xPart} ${yPart}${zPart} F${fmt(feed)}`.replace(/\s+/g, " ").trim());
  }
  return lines;
}

function emitClosedPathWithTabs(
  doc: SketchDocument,
  contour: ToolpathPoint[],
  passZ: number,
  finalCutZ: number,
  tabHeight: number,
  bridgeCount: number,
  bridgeWidth: number
): string[] {
  const lines: string[] = [];
  const contour2D = to2D(contour);
  const total = contourLength(contour2D);
  if (contour2D.length < 3 || total <= EPS) return lines;

  const spans = buildBridgeSpans(contour2D, bridgeCount, bridgeWidth);
  const sampleStep = Math.max(0.5, Math.min(bridgeWidth / 4 || 1, 2));
  const steps = Math.max(contour2D.length, Math.ceil(total / sampleStep));

  let currentZ = passZ;

  for (let i = 1; i <= steps; i++) {
    const at = (total * i) / steps;
    const point = pointAtLength(contour2D, at);

    const inBridge = isInsideAnyBridge(at, spans) && passZ <= finalCutZ + tabHeight + EPS;
    const targetZ = inBridge ? Math.min(finalCutZ + tabHeight, 0) : passZ;

    if (Math.abs(targetZ - currentZ) > EPS) {
      lines.push(`G1 Z${fmt(targetZ)} F${fmt(doc.feedPlunge)}`);
      currentZ = targetZ;
    }

    lines.push(`G1 X${fmt(point.x)} Y${fmt(point.y)} F${fmt(doc.feedCut)}`);
  }

  if (Math.abs(currentZ - passZ) > EPS) {
    lines.push(`G1 Z${fmt(passZ)} F${fmt(doc.feedPlunge)}`);
  }

  return lines;
}

function emitContourPass(
  doc: SketchDocument,
  toolpath: Toolpath,
  passZ: number,
  startZ: number
): string[] {
  const lines: string[] = [];
  const path = toolpath.points;
  const base2D = to2D(path);
  if (base2D.length < 2) return lines;

  lines.push(...emitMoveTo(base2D[0].x, base2D[0].y));

  if (toolpath.useRamping && toolpath.closed && doc.toolType !== "laser") {
    lines.push(...emitToolStart(doc));

    const ramp = generateRampingPass(
      base2D,
      startZ,
      passZ,
      Math.max(1, Math.round(toolpath.rampTurns ?? 1))
    );
    lines.push(...emitLinearPath(ramp, doc.feedCut));
  } else {
    lines.push(...emitCutStart(doc, passZ));
  }

  if (
    toolpath.useBridges &&
    toolpath.closed &&
    (toolpath.bridgeCount ?? 0) > 0 &&
    (toolpath.bridgeWidth ?? 0) > 0 &&
    (toolpath.bridgeHeight ?? 0) > 0 &&
    doc.toolType !== "laser"
  ) {
    lines.push(
      ...emitClosedPathWithTabs(
        doc,
        path,
        passZ,
        toolpath.cutZ,
        toolpath.bridgeHeight ?? 1,
        Math.max(1, toolpath.bridgeCount ?? 2),
        Math.max(0.1, toolpath.bridgeWidth ?? Math.max(doc.toolDiameter * 2, 3))
      )
    );
  } else {
    lines.push(...emitLinearPath(path, doc.feedCut));

    if (toolpath.closed && path.length >= 2) {
      const first = path[0];
      const last = path[path.length - 1];
      const alreadyClosed =
        Math.abs(first.x - last.x) <= EPS && Math.abs(first.y - last.y) <= EPS;

      if (!alreadyClosed) {
        lines.push(`G1 X${fmt(first.x)} Y${fmt(first.y)} F${fmt(doc.feedCut)}`);
      }
    }
  }

  lines.push(...emitCutEnd(doc));
  return lines;
}

function emitPrebuilt3DPath(doc: SketchDocument, toolpath: Toolpath): string[] {
  const lines: string[] = [];
  const points = toolpath.points;
  if (points.length < 2) return lines;

  lines.push(...emitMoveTo(points[0].x, points[0].y));
  lines.push(...emitToolStart(doc));
  lines.push(...emitLinearPath(points, doc.feedCut));
  lines.push(...emitToolEnd(doc));

  return lines;
}

export async function generateSketchGCode(doc: SketchDocument): Promise<string> {
  const lines: string[] = [...emitProgramPreamble(doc)];
  const plannedToolpaths = await planDocumentToolpaths(doc);

  for (const toolpath of plannedToolpaths) {
    if (!toolpath || toolpath.points.length < 2) continue;

    if (is3DPath(toolpath.points)) {
      lines.push(...emitPrebuilt3DPath(doc, toolpath));
      continue;
    }

    const passDepth = Math.max(0.001, Math.abs(toolpath.stepdown ?? doc.passDepth));
    const passes = buildDepthPasses(toolpath.cutZ, passDepth);

    let previousZ = doc.safeZ;
    for (const passZ of passes) {
      lines.push(...emitContourPass(doc, toolpath, passZ, previousZ));
      previousZ = passZ;
    }
  }

  lines.push(...emitProgramPostamble(doc));
  return lines.join("\n") + "\n";
}