import { describe, it, expect } from "vitest";
import { solveConstraints } from "../newton";
import type { SketchPoint, SketchConstraint } from "../../types";

describe("Geometric Constraint Solver", () => {
  it("should solve a simple horizontal constraint", () => {
    const points: SketchPoint[] = [
      { id: "p1", x: 0, y: 0, isFixed: true },
      { id: "p2", x: 10, y: 5 },
    ];
    const constraints: SketchConstraint[] = [
      {
        id: "c1",
        type: "horizontal",
        pointIds: ["p1", "p2"],
        shapeIds: [],
        enabled: true,
      },
    ];

    const solved = solveConstraints(points, constraints);
    const p2 = solved.find(p => p.id === "p2")!;

    expect(p2.y).toBeCloseTo(0);
    expect(p2.x).toBeCloseTo(10);
  });

  it("should solve a distance constraint", () => {
    const points: SketchPoint[] = [
      { id: "p1", x: 0, y: 0, isFixed: true },
      { id: "p2", x: 10, y: 0 },
    ];
    const constraints: SketchConstraint[] = [
      {
        id: "c1",
        type: "distance",
        pointIds: ["p1", "p2"],
        shapeIds: [],
        value: 20,
        enabled: true,
      },
    ];

    const solved = solveConstraints(points, constraints);
    const p2 = solved.find(p => p.id === "p2")!;

    expect(Math.sqrt(p2.x ** 2 + p2.y ** 2)).toBeCloseTo(20);
  });
});
