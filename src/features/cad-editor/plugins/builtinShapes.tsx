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

export const builtinShapesPlugin: CadPlugin = {
  id: "builtin-shapes",
  shapes: [
    defineShapePlugin<SketchRectangle>({
      type: "rectangle",
      getBounds: (shape: SketchRectangle, points: SketchPoint[]) => shapeBounds(shape, points),
      render: ({ shape, points, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
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
      getBounds: (shape: SketchCircle, points: SketchPoint[]) => shapeBounds(shape, points),
      render: ({ shape, points, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
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
      getBounds: (shape: SketchEllipse, points: SketchPoint[]) => shapeBounds(shape, points),
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
      getBounds: (shape: SketchBSpline, points: SketchPoint[]) => shapeBounds(shape, points),
      render: ({ shape, points, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
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
      getBounds: (shape: SketchPolyline, points: SketchPoint[]) => shapeBounds(shape, points),
      render: ({ shape, points, documentHeight, view, isSelected, solveState, onPointerDown, overrideStroke }) => (
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