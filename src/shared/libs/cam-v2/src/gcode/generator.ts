// src/gcode/generator.ts
import type { GCodeGeneratorInput, Point3D, Toolpath } from "../types";
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
import { generateRampingPass } from "../toolpath/ramping";
import { buildBridgeSpans, contourLength, isInsideAnyBridge, pointAtLength } from "../toolpath/bridges";
import { logger } from "@/shared/utils/logger";

const EPS = 1e-6;

function to2D(points: Point3D[]) {
  return points.map((p) => ({ x: p.x, y: p.y }));
}

function is3DPath(points: Point3D[]): boolean {
  return points.some((point) => typeof point.z === "number" && point.z !== 0);
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

function emitLinearPath(points: Point3D[], feed: number): string[] {
  const lines: string[] = [];
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const prev = points[i - 1];
    const xPart = `X${fmt(point.x)}`;
    const yPart = `Y${fmt(point.y)}`;
    // Only emit Z if it changed from the previous point in this segments sequence
    const zChanged =
      typeof point.z === "number" && (typeof prev.z !== "number" || Math.abs(point.z - prev.z) > EPS);
    const zPart = zChanged ? ` Z${fmt(point.z)}` : "";
    lines.push(`G1 ${xPart} ${yPart}${zPart} F${fmt(feed)}`.replace(/\s+/g, " ").trim());
  }
  return lines;
}

function emitClosedPathWithTabs(
  toolpath: Toolpath,
  passZ: number,
  finalCutZ: number,
  plungeFeed: number,
  cutFeed: number
): string[] {
  const lines: string[] = [];
  const contour2D = to2D(toolpath.points);
  const total = contourLength(contour2D);
  if (contour2D.length < 3 || total <= EPS || !toolpath.tabs?.enabled) return lines;

  const spans = buildBridgeSpans(contour2D, toolpath.tabs.count, toolpath.tabs.width);
  const sampleStep = Math.max(0.5, Math.min(toolpath.tabs.width / 4 || 1, 2));
  const steps = Math.max(contour2D.length, Math.ceil(total / sampleStep));

  let currentZ = passZ;

  for (let i = 1; i <= steps; i++) {
    const at = (total * i) / steps;
    const point = pointAtLength(contour2D, at);

    const inBridge = isInsideAnyBridge(at, spans) && passZ <= finalCutZ + toolpath.tabs.height + EPS;
    const targetZ = inBridge ? Math.min(finalCutZ + toolpath.tabs.height, 0) : passZ;

    if (Math.abs(targetZ - currentZ) > EPS) {
      lines.push(`G1 Z${fmt(targetZ)} F${fmt(plungeFeed)}`);
      currentZ = targetZ;
    }

    lines.push(`G1 X${fmt(point.x)} Y${fmt(point.y)} F${fmt(cutFeed)}`);
  }

  if (Math.abs(currentZ - passZ) > EPS) lines.push(`G1 Z${fmt(passZ)} F${fmt(plungeFeed)}`);
  return lines;
}

function emitContourPass(
  toolpath: Toolpath,
  passZ: number,
  startZ: number,
  machine: GCodeGeneratorInput["machine"]
): string[] {
  const lines: string[] = [];
  const path = toolpath.points;
  const base2D = to2D(path);
  if (base2D.length < 2) return lines;

  lines.push(...emitMoveTo(base2D[0].x, base2D[0].y));

  if (toolpath.ramping?.enabled && toolpath.closed) {
    lines.push(...emitToolStart(machine));
    const ramp = generateRampingPass(base2D, startZ, passZ, Math.max(1, toolpath.ramping.turns));
    lines.push(...emitLinearPath(ramp, machine.feedCut));
  } else {
    lines.push(...emitCutStart(machine, passZ));
  }

  if (toolpath.tabs?.enabled && toolpath.closed) {
    lines.push(...emitClosedPathWithTabs(toolpath, passZ, toolpath.cutZ, machine.feedPlunge, machine.feedCut));
  } else {
    // IMPORTANT: We must use passZ for all points in this contour pass.
    // toolpath.points often contains Z=0 (from planning), which would
    // cause G1 to move back to the surface if used directly.
    const pathAtZ = base2D.map((p) => ({ ...p, z: passZ }));
    lines.push(...emitLinearPath(pathAtZ, machine.feedCut));

    if (toolpath.closed && path.length >= 2) {
      const first = path[0];
      const last = path[path.length - 1];
      const alreadyClosed = Math.abs(first.x - last.x) <= EPS && Math.abs(first.y - last.y) <= EPS;
      if (!alreadyClosed) {
        lines.push(`G1 X${fmt(first.x)} Y${fmt(first.y)} Z${fmt(passZ)} F${fmt(machine.feedCut)}`);
      }
    }
  }

  lines.push(...emitCutEnd(machine));
  return lines;
}

function emitPrebuilt3DPath(machine: GCodeGeneratorInput["machine"], toolpath: Toolpath): string[] {
  const lines: string[] = [];
  const points = toolpath.points;
  if (points.length < 2) return lines;

  lines.push(...emitMoveTo(points[0].x, points[0].y));
  lines.push(...emitToolStart(machine));
  // Plunge to the first point's Z before starting linear segments
  lines.push(`G1 Z${fmt(points[0].z)} F${fmt(machine.feedPlunge)}`);
  lines.push(...emitLinearPath(points, machine.feedCut));
  lines.push(...emitToolEnd(machine));
  return lines;
}

export function generateGCode(input: GCodeGeneratorInput): string {
  const { toolpaths, machine } = input;
  const lines: string[] = [...emitProgramPreamble(machine)];

  let hasNegativeZ = false;

  for (const toolpath of toolpaths) {
    if (!toolpath || toolpath.points.length < 2) continue;

    if (is3DPath(toolpath.points)) {
      lines.push(...emitPrebuilt3DPath(machine, toolpath));
      continue;
    }

    const cutZ = toolpath.cutZ;
    if (cutZ < 0) hasNegativeZ = true;

    const passDepth = Math.max(0.001, Math.abs(toolpath.stepdown ?? 1));
    const passes = buildDepthPasses(cutZ, passDepth);

    let previousZ = machine.safeZ;
    for (const passZ of passes) {
      lines.push(...emitContourPass(toolpath, passZ, previousZ, machine));
      previousZ = passZ;
    }
  }

  if (!hasNegativeZ && machine.units !== "inch") {
    // Basic heuristic: for most jobs we expect some cutting below surface (Z < 0)
    logger.warn("GCODE", "No negative Z values found in toolpaths. Tool will not cut material surface.");
  }

  logger.info("GCODE", "G-code generation summary", {
    lines: lines.length,
    toolpaths: toolpaths.length,
    hasNegativeZ
  });

  lines.push(...emitProgramPostamble(machine));
  return lines.join("\n") + "\n";
}