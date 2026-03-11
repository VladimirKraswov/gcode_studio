import type { SketchDocument } from "./types";

/**
 * Serializes the SketchDocument to a JSON string.
 */
export function serializeProject(document: SketchDocument): string {
  return JSON.stringify(
    {
      version: "2.0",
      points: document.points,
      shapes: document.shapes,
      constraints: document.constraints,
      parameters: document.parameters,
      groups: document.groups,
      settings: {
        width: document.width,
        height: document.height,
        units: document.units,
        workOffset: document.workOffset,
        startZ: document.startZ,
        safeZ: document.safeZ,
        cutZ: document.cutZ,
        passDepth: document.passDepth,
        feedCut: document.feedCut,
        feedPlunge: document.feedPlunge,
        feedRapid: document.feedRapid,
        spindleSpeed: document.spindleSpeed,
        toolDiameter: document.toolDiameter,
      },
    },
    null,
    2
  );
}

/**
 * Deserializes a SketchDocument from a JSON string.
 */
export function deserializeProject(json: string): Partial<SketchDocument> {
  const data = JSON.parse(json);

  if (data.version === "1.0") {
    // Legacy migration logic could go here
    return {};
  }

  return {
    ...data.settings,
    points: data.points,
    shapes: data.shapes,
    constraints: data.constraints,
    parameters: data.parameters,
    groups: data.groups,
  };
}
