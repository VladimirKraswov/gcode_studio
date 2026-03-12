import { describe, it, expect } from "vitest";
import { rebuildArrayGroup } from "./array";
import { createEmptySketchDocument } from "./document";
import { createLineShape, createPoint } from "./shapeFactory";
import { addShape, addPoint } from "./document";

describe("Array Model", () => {
  it("should rebuild linear array", () => {
    let doc = createEmptySketchDocument();
    const p1 = createPoint(0, 0);
    const p2 = createPoint(10, 0);
    doc = addPoint(doc, p1);
    doc = addPoint(doc, p2);
    const line = createLineShape("Line 1", p1.id, p2.id);
    doc = addShape(doc, line);

    const groupId = "test-group";
    const definition = {
      type: "linear" as const,
      sourceShapeIds: [line.id],
      params: {
        count: 3,
        spacing: 50,
        axis: "x",
        direction: "positive" as const,
      },
    };

    const nextDoc = rebuildArrayGroup(doc, groupId, definition);

    // Original + 2 copies = 3 shapes total in the group?
    // No, source shape is not in the generated list, but it stays in document.
    // generated list has count - 1 items.
    expect(nextDoc.shapes.length).toBe(3);
    // Points: 2 original + 2*2 copies = 6 total
    expect(nextDoc.points.length).toBe(6);

    // Check positions of generated points
    const p3 = nextDoc.points[2];
    expect(p3.x).toBe(50);
    const p5 = nextDoc.points[4];
    expect(p5.x).toBe(100);
  });

  it("should rebuild linear array in both directions", () => {
    let doc = createEmptySketchDocument();
    const p1 = createPoint(0, 0);
    const p2 = createPoint(10, 0);
    doc = addPoint(doc, p1);
    doc = addPoint(doc, p2);
    const line = createLineShape("Line 1", p1.id, p2.id);
    doc = addShape(doc, line);

    const groupId = "test-group";
    const definition = {
      type: "linear" as const,
      sourceShapeIds: [line.id],
      params: {
        count: 2,
        spacing: 50,
        axis: "x",
        direction: "both" as const,
      },
    };

    const nextDoc = rebuildArrayGroup(doc, groupId, definition);

    // count=2, both directions => 1 forward, 1 backward, 1 original = 3 total
    expect(nextDoc.shapes.length).toBe(3);
    const xs = nextDoc.points.map(p => p.x).sort((a, b) => a - b);
    expect(xs).toContain(-50);
    expect(xs).toContain(0);
    expect(xs).toContain(50);
  });

  it("should rebuild 2D grid linear array", () => {
    let doc = createEmptySketchDocument();
    const p1 = createPoint(0, 0);
    doc = addPoint(doc, p1);
    const line = createLineShape("Line 1", p1.id, p1.id); // Dummy point shape
    doc = addShape(doc, line);

    const groupId = "test-group";
    const definition = {
      type: "linear" as const,
      sourceShapeIds: [line.id],
      params: {
        count: 2,
        spacing: 100,
        axis: "x",
        direction: "positive" as const,
        gridSecondAxis: {
            count: 2,
            spacing: 50,
            axis: "y"
        }
      },
    };

    const nextDoc = rebuildArrayGroup(doc, groupId, definition);

    // 2x2 grid = 4 items. 1 original, 3 generated.
    expect(nextDoc.shapes.length).toBe(4);
    const coords = nextDoc.points.map(p => `${p.x},${p.y}`);
    expect(coords).toContain("0,0");
    expect(coords).toContain("100,0");
    expect(coords).toContain("0,50");
    expect(coords).toContain("100,50");
  });
});
