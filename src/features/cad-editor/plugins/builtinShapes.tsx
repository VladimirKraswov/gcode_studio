import type { CadPlugin } from "./types";
import { defineShapePlugin } from "./types";
import type {
  SketchArc,
  SketchCircle,
  SketchLine,
  SketchPolyline,
  SketchRectangle,
  SketchSvg,
  SketchText,
  SketchEllipse,
  SketchBSpline,
  SketchPoint,
} from "../model/types";

import { RectangleShapeView } from "../canvas/RectangleShapeView";
import { CircleShapeView } from "../canvas/CircleShapeView";
import { LineShapeView } from "../canvas/LineShapeView";
import { ArcShapeView } from "../canvas/ArcShapeView";
import { PolylineShapeView } from "../canvas/PolylineShapeView";
import { TextShapeView } from "../canvas/TextShapeView";
import { SvgShapeView } from "../canvas/SvgShapeView";
import { EllipseShapeView } from "../canvas/EllipseShapeView";
import { BSplineShapeView } from "../canvas/BSplineShapeView";
import { shapeBounds } from "../model/shapeBounds";
import { sampleBSpline } from "../geometry/bspline";
import { sampleArcPoints } from "../geometry/geometryEngine";

export const builtinShapesPlugin: CadPlugin = {
  id: "builtin-shapes",
  shapes: [
    defineShapePlugin<SketchRectangle>({
      type: "rectangle",
      getBounds: (shape: SketchRectangle, points: SketchPoint[]) =>
        shapeBounds(shape, points),
      getSvgPath: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
        const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };
        const xmin = Math.min(p1.x, p2.x);
        const xmax = Math.max(p1.x, p2.x);
        const ymin = Math.min(p1.y, p2.y);
        const ymax = Math.max(p1.y, p2.y);
        return `M ${xmin} ${ymin} L ${xmax} ${ymin} L ${xmax} ${ymax} L ${xmin} ${ymax} Z`;
      },
      getFeedbackAnchor: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
        const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };
        const xmin = Math.min(p1.x, p2.x);
        const xmax = Math.max(p1.x, p2.x);
        const ymax = Math.max(p1.y, p2.y);
        return { x: (xmin + xmax) / 2, y: ymax, nx: 0, ny: 1 };
      },
      render: ({
        shape,
        points,
        documentHeight,
        view,
        isSelected,
        solveState,
        onPointerDown,
        overrideStroke,
      }) => (
        <RectangleShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchCircle>({
      type: "circle",
      getBounds: (shape: SketchCircle, points: SketchPoint[]) =>
        shapeBounds(shape, points),
      getSvgPath: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const center = pointMap.get(shape.center) || { x: 0, y: 0 };
        const r = shape.radius;
        const pts = [];
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          pts.push({
            x: center.x + Math.cos(a) * r,
            y: center.y + Math.sin(a) * r,
          });
        }
        return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
      },
      getFeedbackAnchor: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const center = pointMap.get(shape.center) || { x: 0, y: 0 };
        return { x: center.x, y: center.y + shape.radius, nx: 0, ny: 1 };
      },
      render: ({
        shape,
        points,
        documentHeight,
        view,
        isSelected,
        solveState,
        onPointerDown,
        overrideStroke,
      }) => (
        <CircleShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchLine>({
      type: "line",
      getBounds: (shape: SketchLine, points: SketchPoint[]) => shapeBounds(shape, points),
      getSvgPath: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
        const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };
        return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      },
      getFeedbackAnchor: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
        const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.001) return { x: p1.x, y: p1.y, nx: 0, ny: 1 };
        return {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
          nx: -dy / len,
          ny: dx / len,
        };
      },
      render: ({ shape, points, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
        <LineShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchArc>({
      type: "arc",
      getBounds: (shape: SketchArc, points: SketchPoint[]) => shapeBounds(shape, points),
      getSvgPath: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const center = pointMap.get(shape.center) || { x: 0, y: 0 };
        const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
        const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };
        const startAngle = (Math.atan2(p1.y - center.y, p1.x - center.x) * 180) / Math.PI;
        const endAngle = (Math.atan2(p2.y - center.y, p2.x - center.x) * 180) / Math.PI;
        const pts = sampleArcPoints(center, shape.radius, startAngle, endAngle, shape.clockwise);
        return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      },
      getFeedbackAnchor: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const center = pointMap.get(shape.center) || { x: 0, y: 0 };
        const p1 = pointMap.get(shape.p1) || { x: 0, y: 0 };
        const p2 = pointMap.get(shape.p2) || { x: 0, y: 0 };
        const startAngle = (Math.atan2(p1.y - center.y, p1.x - center.x) * 180) / Math.PI;
        const endAngle = (Math.atan2(p2.y - center.y, p2.x - center.x) * 180) / Math.PI;

        let sweep: number;
        const start = startAngle;
        const end = endAngle;

        if (!shape.clockwise) {
          sweep = end >= start ? end - start : 360 - start + end;
        } else {
          sweep = start >= end ? start - end : 360 - end + start;
          sweep *= -1;
        }

        const midAngle = start + sweep / 2;
        const rad = (midAngle * Math.PI) / 180;
        return {
          x: center.x + Math.cos(rad) * shape.radius,
          y: center.y + Math.sin(rad) * shape.radius,
          nx: Math.cos(rad),
          ny: Math.sin(rad),
        };
      },
      render: ({ shape, points, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
        <ArcShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchEllipse>({
      type: "ellipse",
      getBounds: (shape: SketchEllipse, points: SketchPoint[]) =>
        shapeBounds(shape, points),
      getSvgPath: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const center = pointMap.get(shape.center) || { x: 0, y: 0 };
        const major = pointMap.get(shape.majorAxisPoint) || {
          x: center.x + 10,
          y: center.y,
        };
        const dx = major.x - center.x;
        const dy = major.y - center.y;
        const majorRadius = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const pts = [];
        for (let i = 0; i <= 64; i++) {
          const t = (i / 64) * Math.PI * 2;
          const ex = Math.cos(t) * majorRadius;
          const ey = Math.sin(t) * shape.minorAxisRadius;
          pts.push({
            x: center.x + ex * Math.cos(angle) - ey * Math.sin(angle),
            y: center.y + ex * Math.sin(angle) + ey * Math.cos(angle),
          });
        }
        return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
      },
      getFeedbackAnchor: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const center = pointMap.get(shape.center) || { x: 0, y: 0 };
        const major = pointMap.get(shape.majorAxisPoint) || {
          x: center.x + 10,
          y: center.y,
        };
        const dx = major.x - center.x;
        const dy = major.y - center.y;
        const angle = Math.atan2(dy, dx);
        return {
          x: center.x - Math.sin(angle) * shape.minorAxisRadius,
          y: center.y + Math.cos(angle) * shape.minorAxisRadius,
          nx: -Math.sin(angle),
          ny: Math.cos(angle),
        };
      },
      render: ({ shape, points, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
        <EllipseShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchBSpline>({
      type: "bspline",
      getBounds: (shape: SketchBSpline, points: SketchPoint[]) =>
        shapeBounds(shape, points),
      getSvgPath: (shape, points) => {
        const pts = sampleBSpline(shape, points);
        const d = pts
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
        return shape.periodic ? `${d} Z` : d;
      },
      getFeedbackAnchor: (shape, points) => {
        const pts = sampleBSpline(shape, points);
        if (pts.length < 2) return null;
        const p1 = pts[0];
        const p2 = pts[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.001) return { x: p1.x, y: p1.y, nx: 0, ny: 1 };
        return {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
          nx: -dy / len,
          ny: dx / len,
        };
      },
      render: ({
        shape,
        points,
        documentHeight,
        view,
        isSelected,
        solveState,
        onPointerDown,
        overrideStroke,
      }) => (
        <BSplineShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchPolyline>({
      type: "polyline",
      getBounds: (shape: SketchPolyline, points: SketchPoint[]) =>
        shapeBounds(shape, points),
      getSvgPath: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        const d = shape.pointIds
          .map((id, i) => {
            const p = pointMap.get(id) || { x: 0, y: 0 };
            return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
          })
          .join(" ");
        return shape.closed ? `${d} Z` : d;
      },
      getFeedbackAnchor: (shape, points) => {
        const pointMap = new Map(points.map((p) => [p.id, p]));
        if (shape.pointIds.length < 2) return null;
        const p1 = pointMap.get(shape.pointIds[0]) || { x: 0, y: 0 };
        const p2 = pointMap.get(shape.pointIds[1]) || { x: 0, y: 0 };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.001) return { x: p1.x, y: p1.y, nx: 0, ny: 1 };
        return {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
          nx: -dy / len,
          ny: dx / len,
        };
      },
      render: ({
        shape,
        points,
        documentHeight,
        view,
        isSelected,
        solveState,
        onPointerDown,
        overrideStroke,
      }) => (
        <PolylineShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchText>({
      type: "text",
      getBounds: (shape: SketchText, points: SketchPoint[]) => shapeBounds(shape, points),
      render: ({
        shape,
        points,
        documentHeight,
        view,
        isSelected,
        solveState,
        onPointerDown,
        textPreviewMap,
        overrideStroke,
      }) => (
        <TextShapeView
          shape={shape}
          points={points}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          polylines={textPreviewMap[shape.id] ?? []}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),

    defineShapePlugin<SketchSvg>({
      type: "svg",
      getBounds: (shape: SketchSvg, points: SketchPoint[]) => shapeBounds(shape, points),
      render: ({ shape, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
        <SvgShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          solveState={solveState}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
          overrideStroke={overrideStroke}
        />
      ),
    }),
  ],
};