import type {
  SketchCircle,
  SketchPolyline,
  SketchPolylinePoint,
  SketchRectangle,
  SketchText,
} from "./types";
import { createId } from "./ids";

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
    cutZ: null,
    strokeWidth: 1,
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
  };
}