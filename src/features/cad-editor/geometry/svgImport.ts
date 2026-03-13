// path: /src/modules/cad/geometry/svgImport.ts
import i18next from "i18next";
import type { SketchPolylinePoint } from "../model/types";

export type ParsedSvgGeometry = {
  width: number;
  height: number;
  contours: SketchPolylinePoint[][];
};

function round(value: number): number {
  return Number(value.toFixed(3));
}

function parseNumber(value: string | null | undefined, fallback = 0): number {
  if (!value) return fallback;
  const match = String(value).match(/-?\d*\.?\d+/);
  return match ? Number(match[0]) : fallback;
}

function getSvgSize(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((part) => Number(part));
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
      return {
        width: Math.max(1, parts[2]),
        height: Math.max(1, parts[3]),
      };
    }
  }

  return {
    width: Math.max(1, parseNumber(svg.getAttribute("width"), 100)),
    height: Math.max(1, parseNumber(svg.getAttribute("height"), 100)),
  };
}

function normalizeWhitespace(value: string): string {
  return value.replace(/[\n\r\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokenizePathData(d: string): string[] {
  const matches = normalizeWhitespace(d).match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  return matches ?? [];
}

function isCommandToken(token: string): boolean {
  return /^[a-zA-Z]$/.test(token);
}

function commandParamCount(command: string): number {
  switch (command.toUpperCase()) {
    case "M":
    case "L":
    case "T":
      return 2;
    case "H":
    case "V":
      return 1;
    case "S":
    case "Q":
      return 4;
    case "C":
      return 6;
    case "A":
      return 7;
    case "Z":
      return 0;
    default:
      return 0;
  }
}

/**
 * Разбивает path d на отдельные подпути.
 * Каждый подпуть начинается с M/m и может заканчиваться Z/z.
 * Это убирает ложные диагонали между независимыми контурами.
 */
function splitPathDataToSubpaths(d: string): string[] {
  const tokens = tokenizePathData(d);
  const subpaths: string[] = [];

  let i = 0;
  let current = "";

  while (i < tokens.length) {
    const token = tokens[i];

    if (!isCommandToken(token)) {
      i += 1;
      continue;
    }

    const command = token;
    const upper = command.toUpperCase();
    const paramCount = commandParamCount(command);

    if (upper === "M") {
      if (current.trim()) {
        subpaths.push(current.trim());
      }

      current = command;
      i += 1;

      let firstMoveDone = false;

      while (i < tokens.length && !isCommandToken(tokens[i])) {
        if (i + 1 >= tokens.length) break;

        const x = tokens[i];
        const y = tokens[i + 1];

        if (!firstMoveDone) {
          current += ` ${x} ${y}`;
          firstMoveDone = true;
        } else {
          const implicitLine = command === "m" ? "l" : "L";
          current += ` ${implicitLine} ${x} ${y}`;
        }

        i += 2;
      }

      continue;
    }

    if (!current) {
      i += 1;
      while (i < tokens.length && !isCommandToken(tokens[i])) {
        i += 1;
      }
      continue;
    }

    current += ` ${command}`;
    i += 1;

    if (upper === "Z") {
      subpaths.push(current.trim());
      current = "";
      continue;
    }

    while (i < tokens.length && !isCommandToken(tokens[i])) {
      const chunk = tokens.slice(i, i + paramCount);
      if (chunk.length < paramCount) break;
      current += ` ${chunk.join(" ")}`;
      i += paramCount;
    }
  }

  if (current.trim()) {
    subpaths.push(current.trim());
  }

  return subpaths;
}

function sampleSvgGeometryElement(
  element: SVGGeometryElement,
  svgHeight: number,
  density = 2,
): SketchPolylinePoint[] {
  const totalLength = Math.max(element.getTotalLength(), 0);
  const steps = Math.max(12, Math.ceil(totalLength * density));
  const points: SketchPolylinePoint[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const point = element.getPointAtLength((i / steps) * totalLength);
    points.push({
      x: round(point.x),
      y: round(svgHeight - point.y),
    });
  }

  return points;
}

function samplePathSubpaths(
  pathElement: SVGPathElement,
  svgHeight: number,
  density = 2,
): SketchPolylinePoint[][] {
  const d = pathElement.getAttribute("d") ?? "";
  const subpaths = splitPathDataToSubpaths(d);

  if (subpaths.length <= 1) {
    const polyline = sampleSvgGeometryElement(pathElement, svgHeight, density);
    return polyline.length >= 2 ? [polyline] : [];
  }

  const results: SketchPolylinePoint[][] = [];

  for (const subpathD of subpaths) {
    const subpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    subpath.setAttribute("d", subpathD);

    const polyline = sampleSvgGeometryElement(subpath, svgHeight, density);
    if (polyline.length >= 2) {
      results.push(polyline);
    }
  }

  return results;
}

function rectToPolyline(element: SVGRectElement, svgHeight: number): SketchPolylinePoint[] {
  const x = Number(element.x.baseVal.value);
  const y = Number(element.y.baseVal.value);
  const width = Number(element.width.baseVal.value);
  const height = Number(element.height.baseVal.value);

  return [
    { x: round(x), y: round(svgHeight - (y + height)) },
    { x: round(x + width), y: round(svgHeight - (y + height)) },
    { x: round(x + width), y: round(svgHeight - y) },
    { x: round(x), y: round(svgHeight - y) },
    { x: round(x), y: round(svgHeight - (y + height)) },
  ];
}

function lineToPolyline(element: SVGLineElement, svgHeight: number): SketchPolylinePoint[] {
  return [
    {
      x: round(Number(element.x1.baseVal.value)),
      y: round(svgHeight - Number(element.y1.baseVal.value)),
    },
    {
      x: round(Number(element.x2.baseVal.value)),
      y: round(svgHeight - Number(element.y2.baseVal.value)),
    },
  ];
}

function polyPointsToPolyline(
  points: SVGPointList,
  svgHeight: number,
  closed: boolean,
): SketchPolylinePoint[] {
  const result: SketchPolylinePoint[] = [];
  for (let i = 0; i < points.numberOfItems; i += 1) {
    const point = points.getItem(i);
    result.push({
      x: round(point.x),
      y: round(svgHeight - point.y),
    });
  }

  if (closed && result.length > 1) {
    const first = result[0];
    const last = result[result.length - 1];
    if (Math.abs(first.x - last.x) > 0.001 || Math.abs(first.y - last.y) > 0.001) {
      result.push({ ...first });
    }
  }

  return result;
}

function circleToPolyline(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  svgHeight: number,
  segments = 96,
): SketchPolylinePoint[] {
  const points: SketchPolylinePoint[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    points.push({
      x: round(cx + Math.cos(t) * rx),
      y: round(svgHeight - (cy + Math.sin(t) * ry)),
    });
  }
  return points;
}

export function parseSvgToContours(svgText: string): ParsedSvgGeometry {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.documentElement as unknown as SVGSVGElement;

  if (!svg || svg.tagName.toLowerCase() !== "svg") {
    throw new Error(i18next.t("common.error_svg_invalid"));
  }

  if (doc.querySelector("parsererror")) {
    throw new Error(i18next.t("common.error_svg_parse"));
  }

  const { width, height } = getSvgSize(svg);

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "-99999px";
  host.style.width = "0";
  host.style.height = "0";
  host.style.overflow = "hidden";
  document.body.appendChild(host);

  try {
    const runtimeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    runtimeSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    runtimeSvg.setAttribute("width", String(width));
    runtimeSvg.setAttribute("height", String(height));
    runtimeSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    runtimeSvg.innerHTML = svg.innerHTML;
    host.appendChild(runtimeSvg);

    const contours: SketchPolylinePoint[][] = [];

    runtimeSvg.querySelectorAll("*").forEach((node) => {
      const tag = node.tagName.toLowerCase();

      if (tag === "path" && node instanceof SVGPathElement) {
        const polylines = samplePathSubpaths(node, height);
        polylines.forEach((polyline) => {
          if (polyline.length >= 2) contours.push(polyline);
        });
        return;
      }

      if (tag === "polyline" && node instanceof SVGPolylineElement) {
        const polyline = polyPointsToPolyline(node.points, height, false);
        if (polyline.length >= 2) contours.push(polyline);
        return;
      }

      if (tag === "polygon" && node instanceof SVGPolygonElement) {
        const polyline = polyPointsToPolyline(node.points, height, true);
        if (polyline.length >= 2) contours.push(polyline);
        return;
      }

      if (tag === "rect" && node instanceof SVGRectElement) {
        const polyline = rectToPolyline(node, height);
        if (polyline.length >= 2) contours.push(polyline);
        return;
      }

      if (tag === "line" && node instanceof SVGLineElement) {
        const polyline = lineToPolyline(node, height);
        if (polyline.length >= 2) contours.push(polyline);
        return;
      }

      if (tag === "circle" && node instanceof SVGCircleElement) {
        const polyline = circleToPolyline(
          Number(node.cx.baseVal.value),
          Number(node.cy.baseVal.value),
          Number(node.r.baseVal.value),
          Number(node.r.baseVal.value),
          height,
        );
        if (polyline.length >= 2) contours.push(polyline);
        return;
      }

      if (tag === "ellipse" && node instanceof SVGEllipseElement) {
        const polyline = circleToPolyline(
          Number(node.cx.baseVal.value),
          Number(node.cy.baseVal.value),
          Number(node.rx.baseVal.value),
          Number(node.ry.baseVal.value),
          height,
        );
        if (polyline.length >= 2) contours.push(polyline);
      }
    });

    if (contours.length === 0) {
      throw new Error(i18next.t("common.error_svg_no_contours"));
    }

    return { width, height, contours };
  } finally {
    host.remove();
  }
}