import type {
  SketchArc,
  SketchCircle,
  SketchLine,
  SketchPolyline,
  SketchPolylinePoint,
  SketchRectangle,
  SketchShape,
  SketchSvg,
  SketchText,
} from "./types";
import { createId } from "./ids";

const baseShapeFields = {
  visible: true,
  groupId: null,
} as const;

export function createRectangleShape(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): SketchRectangle {
  return {
    id: createId("rect"),
    type: "rectangle",
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createCircleShape(
  name: string,
  cx: number,
  cy: number,
  radius: number,
): SketchCircle {
  return {
    id: createId("circle"),
    type: "circle",
    name,
    cx,
    cy,
    radius,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createLineShape(
  name: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SketchLine {
  return {
    id: createId("line"),
    type: "line",
    name,
    x1,
    y1,
    x2,
    y2,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createArcShape(params: {
  name: string;
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise?: boolean;
}): SketchArc {
  return {
    id: createId("arc"),
    type: "arc",
    name: params.name,
    cx: params.cx,
    cy: params.cy,
    radius: params.radius,
    startAngle: params.startAngle,
    endAngle: params.endAngle,
    clockwise: params.clockwise ?? false,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createPolylineShape(
  name: string,
  points: SketchPolylinePoint[],
  closed = false,
): SketchPolyline {
  return {
    id: createId("poly"),
    type: "polyline",
    name,
    points,
    closed,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createTextShape(
  name: string,
  x: number,
  y: number,
  text: string,
  height: number,
  letterSpacing: number,
  fontFile: string,
): SketchText {
  return {
    id: createId("text"),
    type: "text",
    name,
    x,
    y,
    text,
    height,
    letterSpacing,
    fontFile,
    rotation: 0,
    align: "left",
    cutMode: "outline",
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createSvgShape(params: {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  preserveAspectRatio: boolean;
  contours: SketchPolylinePoint[][];
}): SketchSvg {
  return {
    id: createId("svg"),
    type: "svg",
    name: params.name,
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    sourceWidth: params.sourceWidth,
    sourceHeight: params.sourceHeight,
    preserveAspectRatio: params.preserveAspectRatio,
    contours: params.contours,
    rotation: 0,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function cloneShape(shape: SketchShape): SketchShape {
  switch (shape.type) {
    case "rectangle":
      return { ...shape, id: createId("rect") };

    case "circle":
      return { ...shape, id: createId("circle") };

    case "line":
      return { ...shape, id: createId("line") };

    case "arc":
      return { ...shape, id: createId("arc") };

    case "polyline":
      return {
        ...shape,
        id: createId("poly"),
        points: shape.points.map((point) => ({ ...point })),
      };

    case "text":
      return { ...shape, id: createId("text") };

    case "svg":
      return {
        ...shape,
        id: createId("svg"),
        contours: shape.contours.map((polyline) =>
          polyline.map((point) => ({ ...point }))
        ),
      };
  }
}