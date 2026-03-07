import type { SketchDocument } from "../../cad/model/types";
import { fmt } from "./format";

export function emitCutStart(doc: SketchDocument, cutZ = doc.cutZ): string[] {
  if (doc.spindleOn) {
    return [`M3 S${Math.max(0, Math.round(doc.laserPower))}`];
  }
  return [`G1 Z${fmt(cutZ)} F${fmt(doc.feedCut)}`];
}

export function emitCutEnd(doc: SketchDocument): string[] {
  if (doc.spindleOn) {
    return ["M5"];
  }
  return [`G0 Z${fmt(doc.safeZ)} F${fmt(doc.feedRapid)}`];
}

export function emitMoveTo(x: number, y: number, feedRapid: number): string[] {
  return [`G0 X${fmt(x)} Y${fmt(y)} F${fmt(feedRapid)}`];
}
