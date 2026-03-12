import type {
  SketchArc,
  SketchCircle,
  SketchLine,
  SketchPolyline,
  SketchRectangle,
  SketchShape,
  SketchSvg,
  SketchText,
  SketchPoint,
  SketchEllipse,
  SketchEllipseArc,
  SketchBSpline,
} from "../model/types";
import { getTextPolylines } from "./textGeometry";
import { rotateCadPoint, sampleArcPoints } from "./geometryEngine";
import { sampleBSpline } from "@/features/cad-editor/geometry/bspline";

export type GeometryContour = {
  points: { x: number; y: number }[];
  closed: boolean;
};

function round(value: number): number {
  return Number(value.toFixed(3));
}

function rotatePoint(
  point: { x: number; y: number },
  origin: { x: number; y: number },
  angleDeg: number,
) {
  return rotateCadPoint(point, origin, angleDeg);
}

function ensureClosed(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 2) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) <= 0.001) {
    return [...points];
  }
  return [...points, { ...first }];
}

function rectangleToContours(shape: SketchRectangle, points: SketchPoint[]): GeometryContour[] {
  const pointMap = new Map(points.map((p) => [p.id, p]));
  const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
  const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };

  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  const rectPoints = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];

  const rotation = shape.rotation ?? 0;
  const rotated = rotation
    ? (() => {
        const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        return rectPoints.map((p) => rotatePoint(p, center, rotation));
      })()
    : rectPoints;

  return [{ points: ensureClosed(rotated), closed: true }];
}

function circleToContours(shape: SketchCircle, points: SketchPoint[], segments = 96): GeometryContour[] {
  const pointMap = new Map(points.map((p) => [p.id, p]));
  const center = pointMap.get(shape.center) || { x: 0, y: 0 };

  const contourPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    contourPoints.push({
      x: round(center.x + Math.cos(t) * shape.radius),
      y: round(center.y + Math.sin(t) * shape.radius),
    });
  }

  return [{ points: ensureClosed(contourPoints), closed: true }];
}

function lineToContours(shape: SketchLine, points: SketchPoint[]): GeometryContour[] {
  const pointMap = new Map(points.map((p) => [p.id, p]));
  const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
  const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };

  return [
    {
      points: [
        { x: p1.x, y: p1.y },
        { x: p2.x, y: p2.y },
      ],
      closed: false,
    },
  ];
}

function arcToContours(shape: SketchArc, points: SketchPoint[], segments = 72): GeometryContour[] {
  const pointMap = new Map(points.map((p) => [p.id, p]));
  const center = pointMap.get(shape.center) || { x: 0, y: 0 };
  const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
  const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };

  const startAngle = (Math.atan2(p1.y - center.y, p1.x - center.x) * 180) / Math.PI;
  const endAngle = (Math.atan2(p2.y - center.y, p2.x - center.x) * 180) / Math.PI;

  return [
    {
      points: sampleArcPoints(
        center,
        shape.radius,
        startAngle,
        endAngle,
        shape.clockwise,
        segments,
      ),
      closed: false,
    },
  ];
}

function ellipseToContours(
  shape: SketchEllipse | SketchEllipseArc,
  points: SketchPoint[],
  segments = 96,
): GeometryContour[] {
  const pointMap = new Map(points.map((p) => [p.id, p]));
  const center = pointMap.get(shape.center) || { x: 0, y: 0 };
  const majorPoint = pointMap.get(shape.majorAxisPoint) || { x: center.x + 10, y: center.y };

  const dx = majorPoint.x - center.x;
  const dy = majorPoint.y - center.y;
  const majorRadius = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const minorRadius = shape.minorAxisRadius;

  const isArc = shape.type === "ellipse-arc";
  const startT = isArc ? ((shape as SketchEllipseArc).startAngle * Math.PI) / 180 : 0;
  const endT = isArc ? ((shape as SketchEllipseArc).endAngle * Math.PI) / 180 : Math.PI * 2;
  const sweep = endT - startT;

  const contourPoints: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = startT + (i / segments) * sweep;
    const px = Math.cos(t) * majorRadius;
    const py = Math.sin(t) * minorRadius;

    contourPoints.push({
      x: round(center.x + px * Math.cos(angle) - py * Math.sin(angle)),
      y: round(center.y + px * Math.sin(angle) + py * Math.cos(angle)),
    });
  }

  return [{ points: isArc ? contourPoints : ensureClosed(contourPoints), closed: !isArc }];
}

function bsplineToContours(shape: SketchBSpline, points: SketchPoint[], segments = 120): GeometryContour[] {
  const sampled = sampleBSpline(shape, points, segments);

  if (sampled.length < 2) return [];

  return [
    {
      points: shape.periodic ? ensureClosed(sampled) : sampled,
      closed: shape.periodic,
    },
  ];
}

function polylineToContours(shape: SketchPolyline, points: SketchPoint[]): GeometryContour[] {
  const pointMap = new Map(points.map((p) => [p.id, p]));
  const contourPoints = shape.pointIds.map((id) => {
    const p = pointMap.get(id) || { x: 0, y: 0 };
    return { x: p.x, y: p.y };
  });

  return [
    {
      points: shape.closed ? ensureClosed(contourPoints) : contourPoints,
      closed: shape.closed,
    },
  ];
}

async function textToContours(shape: SketchText, points: SketchPoint[]): Promise<GeometryContour[]> {
  const polylines = await getTextPolylines(shape, points);
  return polylines.map((poly) => ({
    points: ensureClosed(poly.map((p) => ({ x: p.x, y: p.y }))),
    closed: true,
  }));
}

function svgToContours(shape: SketchSvg): GeometryContour[] {
  const scaleX = (shape.width / Math.max(shape.sourceWidth, 0.0001)) * (shape.scale ?? 1);
  const scaleY = (shape.height / Math.max(shape.sourceHeight, 0.0001)) * (shape.scale ?? 1);
  const rotation = shape.rotation ?? 0;
  const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };

  return shape.contours
    .map((contour) => {
      const contourPoints = contour.map((pointStr) => {
        const [px, py] = pointStr.split(",").map(Number);
        const next = {
          x: round(shape.x + px * scaleX),
          y: round(shape.y + py * scaleY),
        };
        return rotation ? rotatePoint(next, center, rotation) : next;
      });

      const isClosed =
        contourPoints.length >= 3 &&
        Math.hypot(
          contourPoints[0].x - contourPoints[contourPoints.length - 1].x,
          contourPoints[0].y - contourPoints[contourPoints.length - 1].y,
        ) <= 0.001;

      return {
        points: isClosed ? ensureClosed(contourPoints) : contourPoints,
        closed: isClosed,
      };
    })
    .filter((c) => c.points.length >= 2);
}

export async function extractShapeContours(
  shape: SketchShape,
  points: SketchPoint[],
): Promise<GeometryContour[]> {
  switch (shape.type) {
    case "rectangle":
      return rectangleToContours(shape, points);
    case "circle":
      return circleToContours(shape, points);
    case "line":
      return lineToContours(shape, points);
    case "arc":
      return arcToContours(shape, points);
    case "ellipse":
    case "ellipse-arc":
      return ellipseToContours(shape, points);
    case "bspline":
      return bsplineToContours(shape, points);
    case "polyline":
      return polylineToContours(shape, points);
    case "text":
      return textToContours(shape, points);
    case "svg":
      return svgToContours(shape);
    default:
      return [];
  }
}