import type { SketchDocument } from "../../cad/model/types";
import {
  emitCutEnd,
  emitCutStart,
  emitMoveTo,
  emitProgramPostamble,
  emitProgramPreamble,
} from "./emitters";
import { fmt } from "./format";
import { shapeToToolpaths } from "./shapeToToolpath";

function isLaserMode(doc: SketchDocument): boolean {
  return doc.toolType === "laser";
}

function buildPassLevels(targetCutZ: number, passDepth: number): number[] {
  if (targetCutZ >= 0) {
    return [targetCutZ];
  }

  const depth = Math.max(0.001, Math.abs(passDepth));
  const levels: number[] = [];

  let current = -depth;
  while (current > targetCutZ) {
    levels.push(Number(current.toFixed(3)));
    current -= depth;
  }

  if (levels.length === 0 || levels[levels.length - 1] !== targetCutZ) {
    levels.push(targetCutZ);
  }

  return levels;
}

export async function generateSketchGCode(doc: SketchDocument): Promise<string> {
  const lines: string[] = [...emitProgramPreamble(doc)];

  for (const shape of doc.shapes) {
    const toolpaths = await shapeToToolpaths(shape, doc);

    for (const toolpath of toolpaths) {
      if (toolpath.points.length < 2) continue;

      const passLevels = isLaserMode(doc)
        ? [toolpath.cutZ]
        : buildPassLevels(toolpath.cutZ, doc.passDepth);

      for (let passIndex = 0; passIndex < passLevels.length; passIndex += 1) {
        const passCutZ = passLevels[passIndex];

        lines.push(
          `; ${toolpath.name} / pass ${passIndex + 1} / Z${fmt(passCutZ)}`,
        );

        if (!isLaserMode(doc)) {
          lines.push(`G0 Z${fmt(doc.safeZ)} F${fmt(doc.feedRapid)}`);
        }

        lines.push(
          ...emitMoveTo(toolpath.points[0].x, toolpath.points[0].y, doc.feedRapid),
        );

        lines.push(...emitCutStart(doc, passCutZ));

        for (let i = 1; i < toolpath.points.length; i += 1) {
          lines.push(
            `G1 X${fmt(toolpath.points[i].x)} Y${fmt(toolpath.points[i].y)} F${fmt(doc.feedCut)}`,
          );
        }

        if (toolpath.closed) {
          lines.push(
            `G1 X${fmt(toolpath.points[0].x)} Y${fmt(toolpath.points[0].y)} F${fmt(doc.feedCut)}`,
          );
        }

        lines.push(...emitCutEnd(doc));
      }
    }
  }

  lines.push(...emitProgramPostamble(doc));
  return lines.join("\n") + "\n";
}