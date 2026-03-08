import type { CadPoint } from "../../../utils/fontGeometry";
import type { ViewTransform } from "../model/view";
import type { SketchShape } from "../model/types";
import { RectangleShapeView } from "./RectangleShapeView";
import { CircleShapeView } from "./CircleShapeView";
import { LineShapeView } from "./LineShapeView";
import { ArcShapeView } from "./ArcShapeView";
import { PolylineShapeView } from "./PolylineShapeView";
import { TextShapeView } from "./TextShapeView";
import { SvgShapeView } from "./SvgShapeView";

type ShapeRendererProps = {
  shape: SketchShape;
  documentHeight: number;
  view: ViewTransform;
  isSelected: boolean;
  textPreviewMap: Record<string, CadPoint[][]>;
  onPointerDown: (event: React.PointerEvent<SVGElement>, shapeId: string) => void;
};

export function ShapeRenderer({
  shape,
  documentHeight,
  view,
  isSelected,
  textPreviewMap,
  onPointerDown,
}: ShapeRendererProps) {
  switch (shape.type) {
    case "rectangle":
      return (
        <RectangleShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      );

    case "circle":
      return (
        <CircleShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      );

    case "line":
      return (
        <LineShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      );

    case "arc":
      return (
        <ArcShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      );

    case "polyline":
      return (
        <PolylineShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      );

    case "text":
      return (
        <TextShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          polylines={textPreviewMap[shape.id] ?? []}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      );

    case "svg":
      return (
        <SvgShapeView
          shape={shape}
          documentHeight={documentHeight}
          view={view}
          isSelected={isSelected}
          onPointerDown={(event) => onPointerDown(event, shape.id)}
        />
      );
  }
}