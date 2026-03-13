// src/planning/camPlanner.ts

import type {
  LeadConfig,
  PocketPlanInput,
  Point,
  Point3D,
  ProfilePlanInput,
  RampingConfig,
  TabsConfig,
  Toolpath,
} from "../types";
import { buildOffset } from "../geometry/offset";
import {
  generateBestPocket,
  generateOffsetPocketWithHoles,
  generateParallelPocketWithHoles,
} from "../geometry/pocket";
import { optimizeTravel } from "./travelOptimizer";

function closeIfNeeded(points: Point[]): Point[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  const closed = Math.hypot(first.x - last.x, first.y - last.y) <= 1e-6;
  return closed ? [...points] : [...points, { ...first }];
}

function signedArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function normalizeClosed(points: Point[]): Point[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) <= 1e-6) return points.slice(0, -1);
  return [...points];
}

function orientPath(
  points: Point[],
  closed: boolean,
  wantConventional: boolean,
  insideLike: boolean
): Point[] {
  if (!closed || points.length < 3) {
    return wantConventional ? [...points].reverse() : [...points];
  }

  const open = normalizeClosed(points);
  const ccw = signedArea(open) > 0;
  const wantCCW = insideLike ? !wantConventional : wantConventional;
  const oriented = ccw === wantCCW ? open : [...open].reverse();
  return closeIfNeeded(oriented);
}

function to3D(points: Point[], z = 0): Point3D[] {
  return points.map((p) => ({ x: p.x, y: p.y, z }));
}

function resolveTabs(tabs?: Partial<TabsConfig>): TabsConfig {
  return {
    enabled: tabs?.enabled ?? false,
    count: Math.max(1, tabs?.count ?? 2),
    width: Math.max(0.1, tabs?.width ?? 4),
    height: Math.max(0.1, tabs?.height ?? 1),
  };
}

function resolveRamping(ramping?: Partial<RampingConfig>): RampingConfig {
  return {
    enabled: ramping?.enabled ?? false,
    turns: Math.max(1, Math.round(ramping?.turns ?? 1)),
  };
}

function resolveLead(lead?: Partial<LeadConfig>): LeadConfig {
  return {
    enabled: lead?.enabled ?? false,
    length: Math.max(0, lead?.length ?? 0),
  };
}

function makeName(base: string | undefined, fallback: string, index?: number): string {
  if (index == null) return base ?? fallback;
  return `${base ?? fallback} ${index + 1}`;
}

export function planProfile(input: ProfilePlanInput): Toolpath[] {
  const {
    contour,
    operation,
    tool,
    options: {
      name,
      cutZ,
      joinType = "round",
      miterLimit = 4,
      direction = "climb",
      tabs,
      ramping,
      leadIn,
      leadOut,
    },
  } = input;

  const toolRadius = Math.max(0.001, tool.diameter / 2);
  const wantConventional = direction === "conventional";
  const resolvedTabs = resolveTabs(tabs);
  const resolvedRamping = resolveRamping(ramping);
  const resolvedLeadIn = resolveLead(leadIn);
  const resolvedLeadOut = resolveLead(leadOut);

  if (operation === "follow-path") {
    const points = orientPath(contour, false, wantConventional, false);
    return [{
      name: makeName(name, "Follow Path"),
      points: to3D(points),
      closed: false,
      cutZ,
      kind: "path",
      stepdown: tool.passDepth,
      tabs: { ...resolvedTabs, enabled: false },
      ramping: { ...resolvedRamping, enabled: false },
      leadIn: resolvedLeadIn,
      leadOut: resolvedLeadOut,
    }];
  }

  const offset = operation === "profile-outside" ? toolRadius : -toolRadius;
  const loops = buildOffset(contour, offset, joinType, miterLimit);
  const targetLoops = loops.length > 0 ? loops : [closeIfNeeded(contour)];

  return targetLoops.map((loop, index) => {
    const oriented = orientPath(
      loop,
      true,
      wantConventional,
      operation === "profile-inside"
    );

    return {
      name: makeName(name, operation === "profile-outside" ? "Profile Outside" : "Profile Inside", index),
      points: to3D(oriented),
      closed: true,
      cutZ,
      kind: "contour",
      stepdown: tool.passDepth,
      tabs: operation === "profile-outside" ? resolvedTabs : { ...resolvedTabs, enabled: false },
      ramping: resolvedRamping,
      leadIn: resolvedLeadIn,
      leadOut: resolvedLeadOut,
    };
  });
}

export function planPocket(input: PocketPlanInput): Toolpath[] {
  const {
    contours,
    tool,
    options: {
      name,
      cutZ,
      direction = "climb",
      strategy = "auto",
      angle = 0,
      tabs,
      ramping,
      leadIn,
      leadOut,
    },
  } = input;

  const step = Math.max(0.05, tool.diameter * Math.max(0.05, Math.min(1, tool.stepover)));
  const toolRadius = Math.max(0.001, tool.diameter / 2);
  const wantConventional = direction === "conventional";

  let paths: Point[][] = [];
  if (strategy === "offset") paths = generateOffsetPocketWithHoles(contours, toolRadius, step);
  else if (strategy === "parallel") paths = generateParallelPocketWithHoles(contours, toolRadius, step, angle);
  else paths = generateBestPocket(contours, toolRadius, step, angle);

  const oriented = optimizeTravel(
    paths.map((points) => ({ points, closed: false })),
    { x: 0, y: 0 }
  );

  return oriented.map((path, index) => ({
    name: makeName(name, "Pocket", index),
    points: to3D(wantConventional ? [...path.points].reverse() : path.points),
    closed: false,
    cutZ,
    kind: "pocket",
    stepdown: tool.passDepth,
    tabs: { ...resolveTabs(tabs), enabled: false },
    ramping: { ...resolveRamping(ramping), enabled: false },
    leadIn: resolveLead(leadIn),
    leadOut: resolveLead(leadOut),
  }));
}
