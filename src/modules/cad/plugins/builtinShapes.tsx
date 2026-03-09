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
} from "../model/types";

import { RectangleShapeView } from "../canvas/RectangleShapeView";
import { CircleShapeView } from "../canvas/CircleShapeView";
import { LineShapeView } from "../canvas/LineShapeView";
import { ArcShapeView } from "../canvas/ArcShapeView";
import { PolylineShapeView } from "../canvas/PolylineShapeView";
import { TextShapeView } from "../canvas/TextShapeView";
import { SvgShapeView } from "../canvas/SvgShapeView";
import { shapeBounds } from "../model/shapeBounds";

export const builtinShapesPlugin: CadPlugin = {
  id: "builtin-shapes",
  shapes: [
    defineShapePlugin<SketchRectangle>({
      type: "rectangle",
      getBounds: shapeBounds,
      render: ({ shape, documentHeight, view, isSelected, onPointerDown }) => (
        <RectangleShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      ),
    }),

    defineShapePlugin<SketchCircle>({
      type: "circle",
      getBounds: shapeBounds,
      render: ({ shape, documentHeight, view, isSelected, onPointerDown }) => (
        <CircleShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      ),
    }),

    defineShapePlugin<SketchLine>({
      type: "line",
      getBounds: shapeBounds,
      render: ({ shape, documentHeight, view, isSelected, onPointerDown }) => (
        <LineShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      ),
    }),

    defineShapePlugin<SketchArc>({
      type: "arc",
      getBounds: shapeBounds,
      render: ({ shape, documentHeight, view, isSelected, onPointerDown }) => (
        <ArcShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      ),
    }),

    defineShapePlugin<SketchPolyline>({
      type: "polyline",
      getBounds: shapeBounds,
      render: ({ shape, documentHeight, view, isSelected, onPointerDown }) => (
        <PolylineShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      ),
    }),

    defineShapePlugin<SketchText>({
      type: "text",
      getBounds: shapeBounds,
      render: ({
        shape,
        documentHeight,
        view,
        isSelected,
        onPointerDown,
        textPreviewMap,
      }) => (
        <TextShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          polylines={textPreviewMap[shape.id] ?? []}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      ),
    }),

    defineShapePlugin<SketchSvg>({
      type: "svg",
      getBounds: shapeBounds,
      render: ({ shape, documentHeight, view, isSelected, onPointerDown }) => (
        <SvgShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      ),
    }),
  ],
};