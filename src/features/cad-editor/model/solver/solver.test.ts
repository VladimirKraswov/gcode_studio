import { describe, it, expect } from "vitest";
import { solveConstraints } from "./newton";
import type { SketchPoint, SketchConstraint, SketchShape } from "../types";

describe("Constraint Solver", () => {
  const createPoint = (id: string, x: number, y: number, isFixed = false): SketchPoint => ({
    id, x, y, isFixed
  });

  it("should solve horizontal constraint", () => {
    const points: SketchPoint[] = [
      createPoint("p1", 0, 0, true),
      createPoint("p2", 10, 5),
    ];
    const constraints: SketchConstraint[] = [{
      id: "c1",
      type: "horizontal",
      targets: [{ kind: "point", pointId: "p1" }, { kind: "point", pointId: "p2" }],
      enabled: true,
    }];

    const solved = solveConstraints(points, constraints);
    const p2 = solved.find(p => p.id === "p2")!;
    expect(p2.y).toBeCloseTo(0);
  });

  it("should solve vertical constraint", () => {
    const points: SketchPoint[] = [
      createPoint("p1", 0, 0, true),
      createPoint("p2", 10, 5),
    ];
    const constraints: SketchConstraint[] = [{
      id: "c1",
      type: "vertical",
      targets: [{ kind: "point", pointId: "p1" }, { kind: "point", pointId: "p2" }],
      enabled: true,
    }];

    const solved = solveConstraints(points, constraints);
    const p2 = solved.find(p => p.id === "p2")!;
    expect(p2.x).toBeCloseTo(0);
  });

  it("should solve distance constraint", () => {
    const points: SketchPoint[] = [
      createPoint("p1", 0, 0, true),
      createPoint("p2", 10, 0),
    ];
    const constraints: SketchConstraint[] = [{
      id: "c1",
      type: "distance",
      targets: [{ kind: "point", pointId: "p1" }, { kind: "point", pointId: "p2" }],
      value: 20,
      enabled: true,
    }];

    const solved = solveConstraints(points, constraints);
    const p2 = solved.find(p => p.id === "p2")!;
    const dist = Math.sqrt(p2.x ** 2 + p2.y ** 2);
    expect(dist).toBeCloseTo(20);
  });

  it("should solve symmetry constraint (current implementation might fail or be inaccurate)", () => {
    const points: SketchPoint[] = [
      createPoint("s1", 0, -10, true),
      createPoint("s2", 0, 10, true),
      createPoint("p1", 10, 5),
      createPoint("p2", 5, -5),
    ];
    const constraints: SketchConstraint[] = [{
      id: "c1",
      type: "symmetric",
      targets: [
        { kind: "point", pointId: "p1" },
        { kind: "point", pointId: "p2" },
        { kind: "point", pointId: "s1" },
        { kind: "point", pointId: "s2" },
      ],
      enabled: true,
    }];

    const solved = solveConstraints(points, constraints);
    const p1 = solved.find(p => p.id === "p1")!;
    const p2 = solved.find(p => p.id === "p2")!;

    // Midpoint should be on symmetry line (x=0)
    expect((p1.x + p2.x) / 2).toBeCloseTo(0);
    // Line p1-p2 should be perpendicular to s1-s2 (vertical), so p1-p2 should be horizontal
    expect(p1.y).toBeCloseTo(p2.y);
  });

  it("should solve tangent constraint (circle and line)", () => {
    const points: SketchPoint[] = [
      createPoint("c1", 0, 0, true), // Center
      createPoint("l1", 20, -10, true), // Line point 1
      createPoint("l2", 20, 10, true),  // Line point 2
    ];
    const shapes: SketchShape[] = [
        { id: "circle1", type: "circle", center: "c1", radius: 10, visible: true, groupId: null } as any
    ];
    const constraints: SketchConstraint[] = [{
      id: "c1",
      type: "tangent",
      targets: [
        { kind: "point", pointId: "c1" }, // Current tangent implementation takes center point and value (radius)
        { kind: "point", pointId: "l1" },
        { kind: "point", pointId: "l2" },
      ],
      value: 10,
      enabled: true,
    }];

    // Wait, the line is fixed at x=20. The center is at x=0. Radius is 10.
    // To be tangent, the line should be at x=10 or x=-10, OR the center should move to x=10 or x=30.
    // Since center and line are fixed, this is impossible.
    // Let's make the center free.
    points[0].isFixed = false;
    points[0].x = 5;

    const solved = solveConstraints(points, constraints, shapes);
    const c1 = solved.find(p => p.id === "c1")!;
    // Center should move to x=10 to be tangent to line at x=20 with radius 10
    expect(c1.x).toBeCloseTo(10);
  });

  it("should solve collinear constraint", () => {
    const points: SketchPoint[] = [
      createPoint("p1", 0, 0, true),
      createPoint("p2", 10, 0, true),
      createPoint("p3", 5, 5),
      createPoint("p4", 15, 5),
    ];
    const constraints: SketchConstraint[] = [{
      id: "c1",
      type: "collinear",
      targets: [
        { kind: "point", pointId: "p1" },
        { kind: "point", pointId: "p2" },
        { kind: "point", pointId: "p3" },
        { kind: "point", pointId: "p4" },
      ],
      enabled: true,
    }];

    const solved = solveConstraints(points, constraints);
    const p3 = solved.find(p => p.id === "p3")!;
    const p4 = solved.find(p => p.id === "p4")!;

    expect(p3.y).toBeCloseTo(0);
    expect(p4.y).toBeCloseTo(0);
  });

  it("should solve diameter constraint", () => {
    const points: SketchPoint[] = [
      createPoint("c1", 0, 0, true),
      createPoint("p1", 10, 0),
    ];
    const constraints: SketchConstraint[] = [{
      id: "c1",
      type: "diameter",
      targets: [
        { kind: "point", pointId: "c1" },
        { kind: "point", pointId: "p1" },
      ],
      value: 40,
      enabled: true,
    }];

    const solved = solveConstraints(points, constraints);
    const p1 = solved.find(p => p.id === "p1")!;
    const dist = Math.sqrt(p1.x ** 2 + p1.y ** 2);
    expect(dist).toBeCloseTo(20); // Diameter 40 => Radius 20
  });
});
