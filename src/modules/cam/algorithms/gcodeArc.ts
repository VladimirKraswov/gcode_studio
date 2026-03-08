import type { CadPoint } from "../../cad/geometry/textGeometry";

export type ArcParams = {
  start: CadPoint;
  end: CadPoint;
  center: CadPoint;
  clockwise: boolean;
};

export function arcToIJK(start: CadPoint, center: CadPoint): { i: number; j: number } {
  return { i: center.x - start.x, j: center.y - start.y };
}

export function formatArcGCode(arc: ArcParams, feed: number, z?: number): string {
  const { i, j } = arcToIJK(arc.start, arc.center);
  const gCode = arc.clockwise ? "G2" : "G3";
  const xPart = `X${arc.end.x.toFixed(3)}`;
  const yPart = `Y${arc.end.y.toFixed(3)}`;
  const zPart = z !== undefined ? ` Z${z.toFixed(3)}` : "";
  const iPart = ` I${i.toFixed(3)}`;
  const jPart = ` J${j.toFixed(3)}`;
  const fPart = ` F${feed}`;
  return `${gCode}${xPart}${yPart}${zPart}${iPart}${jPart}${fPart}`.replace(/\s+/g, " ").trim();
}