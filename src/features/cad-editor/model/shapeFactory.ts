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
} from "./types";
import { createId } from "./ids";
import { createDefaultCamSettings } from "./document";

const baseShapeFields = {
  visible: true,
  groupId: null,
  camSettings: createDefaultCamSettings(),
} as const;

export function createPoint(x: number, y: number): SketchPoint {
  return {
    id: createId("pt"),
    x,
    y,
  };
}

export function createRectangleShape(
  name: string,
  p1: string,
  p2: string,
): SketchRectangle {
  return {
    id: createId("rect"),
    type: "rectangle",
    name,
    p1,
    p2,
    rotation: 0,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createCircleShape(
  name: string,
  center: string,
  radius: number,
): SketchCircle {
  return {
    id: createId("circle"),
    type: "circle",
    name,
    center,
    radius,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createLineShape(
  name: string,
  p1: string,
  p2: string,
): SketchLine {
  return {
    id: createId("line"),
    type: "line",
    name,
    p1,
    p2,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createArcShape(params: {
  name: string;
  center: string;
  p1: string;
  p2: string;
  radius: number;
  clockwise?: boolean;
}): SketchArc {
  return {
    id: createId("arc"),
    type: "arc",
    name: params.name,
    center: params.center,
    p1: params.p1,
    p2: params.p2,
    radius: params.radius,
    clockwise: params.clockwise ?? false,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createEllipseShape(
  name: string,
  center: string,
  majorAxisPoint: string,
  minorAxisRadius: number,
): SketchEllipse {
  return {
    id: createId("ellipse"),
    type: "ellipse",
    name,
    center,
    majorAxisPoint,
    minorAxisRadius,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createEllipseArcShape(params: {
  name: string,
  center: string,
  majorAxisPoint: string,
  minorAxisRadius: number,
  startAngle: number,
  endAngle: number,
}): SketchEllipseArc {
  return {
    id: createId("ellarc"),
    type: "ellipse-arc",
    name: params.name,
    center: params.center,
    majorAxisPoint: params.majorAxisPoint,
    minorAxisRadius: params.minorAxisRadius,
    startAngle: params.startAngle,
    endAngle: params.endAngle,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createBSplineShape(
  name: string,
  controlPointIds: string[],
  degree = 3,
  periodic = false,
): SketchBSpline {
  return {
    id: createId("bspline"),
    type: "bspline",
    name,
    controlPointIds,
    degree,
    periodic,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createPolylineShape(
  name: string,
  pointIds: string[],
  closed = false,
): SketchPolyline {
  return {
    id: createId("poly"),
    type: "polyline",
    name,
    pointIds,
    closed,
    cutZ: null,
    strokeWidth: 1,
    ...baseShapeFields,
  };
}

export function createTextShape(
  name: string,
  anchorPoint: string,
  text: string,
  height: number,
  letterSpacing: number,
  fontFile: string,
): SketchText {
  return {
    id: createId("text"),
    type: "text",
    name,
    anchorPoint,
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
  anchorPoint: string;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  preserveAspectRatio: boolean;
  contours: string[][];
}): SketchSvg {
  return {
    id: createId("svg"),
    type: "svg",
    name: params.name,
    anchorPoint: params.anchorPoint,
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
  const nextId = createId(shape.type.slice(0, 4));
  switch (shape.type) {
    case "rectangle":
      return { ...shape, id: nextId } as SketchRectangle;

    case "circle":
      return { ...shape, id: nextId } as SketchCircle;

    case "line":
      return { ...shape, id: nextId } as SketchLine;

    case "arc":
      return { ...shape, id: nextId } as SketchArc;

    case "ellipse":
      return { ...shape, id: nextId } as SketchEllipse;

    case "ellipse-arc":
      return { ...shape, id: nextId } as SketchEllipseArc;

    case "bspline":
      return { ...shape, id: nextId, controlPointIds: [...shape.controlPointIds] } as SketchBSpline;

    case "polyline":
      return {
        ...shape,
        id: nextId,
        pointIds: [...shape.pointIds],
      } as SketchPolyline;

    case "text":
      return { ...shape, id: nextId } as SketchText;

    case "svg":
      return {
        ...shape,
        id: nextId,
        contours: shape.contours.map((polyline) => [...polyline]),
      } as SketchSvg;

    default:
      return { ...shape as any, id: createId("shape") } as any;
  }
}
