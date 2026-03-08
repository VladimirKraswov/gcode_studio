import type { SketchDocument } from "../../cad/model/types";
import { collectVisibleShapes } from "../../cad/model/grouping";
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
import { shapeToToolpaths } from "./shapeToToolpath";
import { optimizeTravelOrder } from "../algorithms/travelOptimizer";
import { generateRampingPass } from "../algorithms/ramping";
import { insertBridges } from "../algorithms/bridges";
import type { Toolpath, ToolpathPoint } from "../types";

function to2D(points: ToolpathPoint[]) {
  return points.map(p => ({ x: p.x, y: p.y }));
}

function is3DPath(points: ToolpathPoint[]): boolean {
  return points.some(point => typeof point.z === "number");
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

function emitContourPass(doc: SketchDocument, toolpath: Toolpath, passZ: number, startZ: number): string[] {
  const lines: string[] = [];
  const base2D = to2D(toolpath.points);
  if (base2D.length < 2) return lines;

  if (toolpath.useBridges && toolpath.closed) {
    const segments = insertBridges(
      base2D,
      Math.max(1, toolpath.bridgeCount ?? 2),
      Math.max(0.1, toolpath.bridgeWidth ?? Math.max(doc.toolDiameter * 2, 3))
    );
    for (const segment of segments) {
      if (segment.length < 2) continue;
      lines.push(...emitMoveTo(segment[0].x, segment[0].y, doc.feedRapid));
      if (toolpath.useRamping && doc.toolType !== "laser") {
        lines.push(...emitToolStart(doc));
        const ramp = generateRampingPass(segment, startZ, passZ, 1);
        lines.push(...emitLinearPath(ramp, doc.feedCut));
        lines.push(...emitToolEnd(doc));
      } else {
        lines.push(...emitCutStart(doc, passZ));
        lines.push(...emitLinearPath(segment, doc.feedCut));
        lines.push(...emitCutEnd(doc));
      }
    }
    return lines;
  }

  lines.push(...emitMoveTo(base2D[0].x, base2D[0].y, doc.feedRapid));

  if (toolpath.useRamping && toolpath.closed && doc.toolType !== "laser") {
    lines.push(...emitToolStart(doc));
    const ramp = generateRampingPass(base2D, startZ, passZ, 1);
    lines.push(...emitLinearPath(ramp, doc.feedCut));
    lines.push(...emitToolEnd(doc));
    return lines;
  }

  lines.push(...emitCutStart(doc, passZ));
  lines.push(...emitLinearPath(toolpath.points, doc.feedCut));
  if (toolpath.closed) {
    const first = toolpath.points[0];
    lines.push(`G1 X${fmt(first.x)} Y${fmt(first.y)} F${fmt(doc.feedCut)}`);
  }
  lines.push(...emitCutEnd(doc));
  return lines;
}

function emitPrebuilt3DPath(doc: SketchDocument, toolpath: Toolpath): string[] {
  const lines: string[] = [];
  const points = toolpath.points;
  if (points.length < 2) return lines;
  lines.push(...emitMoveTo(points[0].x, points[0].y, doc.feedRapid));
  lines.push(...emitToolStart(doc));
  lines.push(...emitLinearPath(points, doc.feedCut));
  lines.push(...emitToolEnd(doc));
  return lines;
}

export async function generateSketchGCode(doc: SketchDocument): Promise<string> {
  const lines: string[] = [...emitProgramPreamble(doc)];
  const shapes = collectVisibleShapes(doc);
  const allToolpaths: (Toolpath & { shapeId: string })[] = [];

  for (const shape of shapes) {
    const toolpaths = await shapeToToolpaths(shape, doc);
    toolpaths.forEach(tp => allToolpaths.push({ ...tp, shapeId: shape.id }));
  }

  const order = optimizeTravelOrder(allToolpaths.map(tp => to2D(tp.points)), { x: 0, y: 0 });

  for (const index of order) {
    const toolpath = allToolpaths[index];
    if (!toolpath || toolpath.points.length < 2) continue;

    if (is3DPath(toolpath.points)) {
      lines.push(...emitPrebuilt3DPath(doc, toolpath));
      continue;
    }

    const passes = buildDepthPasses(toolpath.cutZ, doc.passDepth);
    let previousZ = doc.safeZ;
    for (const passZ of passes) {
      lines.push(...emitContourPass(doc, toolpath, passZ, previousZ));
      previousZ = passZ;
    }
  }

  lines.push(...emitProgramPostamble(doc));
  return lines.join("\n") + "\n";
}