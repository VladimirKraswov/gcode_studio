import opentype from "opentype.js";
import type { SketchText } from "@/features/cad-editor/model/types";
import { rotateCadPoint } from "@/features/cad-editor/geometry/geometryEngine";

export type CadPoint = {
  x: number;
  y: number;
};

type FontLike = Awaited<ReturnType<typeof opentype.load>>;

const fontCache = new Map<string, Promise<FontLike>>();

function round(value: number): number {
  return Number(value.toFixed(3));
}

function getFontUrl(fontFile: string): string {
  if (!fontFile) {
    return "/fonts/NotoSans-Regular.ttf";
  }

  if (fontFile.startsWith("/")) {
    return fontFile;
  }

  return `/fonts/${fontFile}`;
}

export async function loadFont(fontFile: string): Promise<FontLike> {
  const url = getFontUrl(fontFile);

  if (!fontCache.has(url)) {
    fontCache.set(url, opentype.load(url));
  }

  return fontCache.get(url)!;
}

function quad(p0: CadPoint, p1: CadPoint, p2: CadPoint, t: number): CadPoint {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function cubic(
  p0: CadPoint,
  p1: CadPoint,
  p2: CadPoint,
  p3: CadPoint,
  t: number,
): CadPoint {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y,
  };
}

export function pathCommandsToPolylines(
  commands: Array<Record<string, number | string>>,
  curveSteps = 14,
): CadPoint[][] {
  const result: CadPoint[][] = [];
  let current: CadPoint[] = [];
  let pen: CadPoint = { x: 0, y: 0 };
  let subpathStart: CadPoint | null = null;

  function pushPoint(x: number, y: number) {
    const point = { x: round(x), y: round(y) };
    current.push(point);
    pen = point;
  }

  function flushCurrent() {
    if (current.length > 1) {
      result.push(current);
    }
    current = [];
    subpathStart = null;
  }

  for (const cmd of commands) {
    const type = String(cmd.type);

    if (type === "M") {
      flushCurrent();
      pushPoint(Number(cmd.x), Number(cmd.y));
      subpathStart = { ...pen };
      continue;
    }

    if (type === "L") {
      pushPoint(Number(cmd.x), Number(cmd.y));
      continue;
    }

    if (type === "Q") {
      const p0 = pen;
      const p1 = { x: Number(cmd.x1), y: Number(cmd.y1) };
      const p2 = { x: Number(cmd.x), y: Number(cmd.y) };

      for (let i = 1; i <= curveSteps; i += 1) {
        const p = quad(p0, p1, p2, i / curveSteps);
        pushPoint(p.x, p.y);
      }
      continue;
    }

    if (type === "C") {
      const p0 = pen;
      const p1 = { x: Number(cmd.x1), y: Number(cmd.y1) };
      const p2 = { x: Number(cmd.x2), y: Number(cmd.y2) };
      const p3 = { x: Number(cmd.x), y: Number(cmd.y) };

      for (let i = 1; i <= curveSteps; i += 1) {
        const p = cubic(p0, p1, p2, p3, i / curveSteps);
        pushPoint(p.x, p.y);
      }
      continue;
    }

    if (type === "Z") {
      if (subpathStart && current.length > 0) {
        const last = current[current.length - 1];
        if (
          Math.abs(last.x - subpathStart.x) > 0.001 ||
          Math.abs(last.y - subpathStart.y) > 0.001
        ) {
          pushPoint(subpathStart.x, subpathStart.y);
        }
      }
      flushCurrent();
    }
  }

  flushCurrent();
  return result;
}

function getTextWidthApprox(polylines: CadPoint[][]): number {
  if (polylines.length === 0) {
    return 0;
  }

  const xs = polylines.flat().map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs);
}

export async function getTextPolylines(shape: SketchText): Promise<CadPoint[][]> {
  const font = await loadFont(shape.fontFile);
  const path = font.getPath(shape.text, 0, 0, shape.height, {
    kerning: true,
    letterSpacing: shape.letterSpacing ?? 0,
  });

  let polylines = pathCommandsToPolylines(
    path.commands as Array<Record<string, number | string>>,
    14,
  );

  if (polylines.length === 0) {
    return [];
  }

  polylines = polylines.map((polyline) =>
    polyline.map((point) => ({
      x: point.x,
      y: -point.y,
    })),
  );

  const xs = polylines.flat().map((p) => p.x);
  const ys = polylines.flat().map((p) => p.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = getTextWidthApprox(polylines);

  let shiftX = 0;
  const align = shape.align ?? "left";

  if (align === "center") {
    shiftX = -width / 2;
  } else if (align === "right") {
    shiftX = -width;
  }

  polylines = polylines.map((polyline) =>
    polyline.map((point) => ({
      x: round(point.x - minX + shape.x + shiftX),
      y: round(point.y - minY + shape.y),
    })),
  );

  if ((shape.rotation ?? 0) !== 0) {
    const origin = { x: shape.x, y: shape.y };
    polylines = polylines.map((polyline) =>
      polyline.map((point) => rotateCadPoint(point, origin, shape.rotation ?? 0)),
    );
  }

  return polylines;
}