import type {
  SketchArc,
  SketchCircle,
  SketchLine,
  SketchPolyline,
  SketchRectangle,
  SketchShape,
  SketchSvg,
  SketchText,
} from "../../cad/model/types";
import { getTextPolylines } from "../../cad/geometry/textGeometry";
import { rotateCadPoint, sampleArcPoints } from "../../geometry/geometryEngine";

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
  angleDeg: number
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

function rectangleToContours(shape: SketchRectangle): GeometryContour[] {
  const points = [
    { x: shape.x, y: shape.y },
    { x: shape.x + shape.width, y: shape.y },
    { x: shape.x + shape.width, y: shape.y + shape.height },
    { x: shape.x, y: shape.y + shape.height },
  ];

  const rotation = shape.rotation ?? 0;
  const rotated = rotation
    ? (() => {
        const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
        return points.map((p) => rotatePoint(p, center, rotation));
      })()
    : points;

  return [{ points: ensureClosed(rotated), closed: true }];
}

function circleToContours(shape: SketchCircle, segments = 96): GeometryContour[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push({
      x: round(shape.cx + Math.cos(t) * shape.radius),
      y: round(shape.cy + Math.sin(t) * shape.radius),
    });
  }

  return [{ points: ensureClosed(points), closed: true }];
}

function lineToContours(shape: SketchLine): GeometryContour[] {
  return [
    {
      points: [
        { x: shape.x1, y: shape.y1 },
        { x: shape.x2, y: shape.y2 },
      ],
      closed: false,
    },
  ];
}

function arcToContours(shape: SketchArc, segments = 72): GeometryContour[] {
  return [
    {
      points: sampleArcPoints(
        { x: shape.cx, y: shape.cy },
        shape.radius,
        shape.startAngle,
        shape.endAngle,
        shape.clockwise,
        segments
      ),
      closed: false,
    },
  ];
}

function polylineToContours(shape: SketchPolyline): GeometryContour[] {
  const points = shape.points.map((p) => ({ x: p.x, y: p.y }));
  return [
    {
      points: shape.closed ? ensureClosed(points) : points,
      closed: shape.closed,
    },
  ];
}

async function textToContours(shape: SketchText): Promise<GeometryContour[]> {
  const polylines = await getTextPolylines(shape);
  return polylines.map((poly) => ({
    points: ensureClosed(poly.map((p) => ({ x: p.x, y: p.y }))),
    closed: true,
  }));
}

function svgToContours(shape: SketchSvg): GeometryContour[] {
  const scaleX = shape.width / Math.max(shape.sourceWidth, 0.0001);
  const scaleY = shape.height / Math.max(shape.sourceHeight, 0.0001);
  const rotation = shape.rotation ?? 0;
  const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };

  return shape.contours
    .map((contour) => {
      const points = contour.map((point) => {
        const next = {
          x: round(shape.x + point.x * scaleX),
          y: round(shape.y + point.y * scaleY),
        };
        return rotation ? rotatePoint(next, center, rotation) : next;
      });

      const isClosed =
        points.length >= 3 &&
        Math.hypot(
          points[0].x - points[points.length - 1].x,
          points[0].y - points[points.length - 1].y
        ) <= 0.001;

      return {
        points: isClosed ? ensureClosed(points) : points,
        closed: isClosed,
      };
    })
    .filter((c) => c.points.length >= 2);
}

export async function extractShapeContours(shape: SketchShape): Promise<GeometryContour[]> {
  switch (shape.type) {
    case "rectangle":
      return rectangleToContours(shape);
    case "circle":
      return circleToContours(shape);
    case "line":
      return lineToContours(shape);
    case "arc":
      return arcToContours(shape);
    case "polyline":
      return polylineToContours(shape);
    case "text":
      return textToContours(shape);
    case "svg":
      return svgToContours(shape);
  }
}