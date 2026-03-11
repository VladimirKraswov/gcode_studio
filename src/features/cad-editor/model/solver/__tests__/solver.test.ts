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

function expect(actual: any) {
  return {
    toBeCloseTo: (expected: number, precision = 2) => {
      if (Math.abs(actual - expected) > Math.pow(10, -precision)) {
        throw new Error(`Expected ${actual} to be close to ${expected}`);
      }
    }
  };
}

function describe(name: string, fn: () => void) {
  console.log(`Running suite: ${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
  }
}
