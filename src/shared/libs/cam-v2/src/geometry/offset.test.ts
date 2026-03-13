import { describe, it, expect } from 'vitest';
import { buildOffset } from './offset';

describe('buildOffset validation', () => {
  it('should offset square inward with -10', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ];
    const inv = buildOffset(square, -10);
    expect(inv.length).toBe(1);
    expect(inv[0][0].x).toBeCloseTo(10, 1);
    expect(inv[0][0].y).toBeCloseTo(10, 1);
  });

  it('should offset square outward with +10', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ];
    const out = buildOffset(square, 10);
    expect(out.length).toBe(1);

    // Check bounding box instead of first point
    const minX = Math.min(...out[0].map(p => p.x));
    const minY = Math.min(...out[0].map(p => p.y));
    const maxX = Math.max(...out[0].map(p => p.x));
    const maxY = Math.max(...out[0].map(p => p.y));

    expect(minX).toBeCloseTo(-10, 1);
    expect(minY).toBeCloseTo(-10, 1);
    expect(maxX).toBeCloseTo(110, 1);
    expect(maxY).toBeCloseTo(110, 1);
  });

  it('should offset triangle inward correctly', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 86.6 },
      { x: 0, y: 0 }
    ];
    const inv = buildOffset(triangle, -10);
    expect(inv.length).toBe(1);

    const minX = Math.min(...inv[0].map(p => p.x));
    const minY = Math.min(...inv[0].map(p => p.y));
    expect(minX).toBeGreaterThan(0);
    expect(minY).toBeGreaterThan(0);

    // Check if the resulting triangle is still a triangle (approx)
    expect(inv[0].length).toBeGreaterThanOrEqual(3);

    // Area should be smaller
    const originalArea = Math.abs(50 * 86.6 / 2);
    let invArea = 0;
    for (let i = 0; i < inv[0].length - 1; i++) {
        const a = inv[0][i], b = inv[0][i+1];
        invArea += a.x * b.y - b.x * a.y;
    }
    invArea = Math.abs(invArea / 2);
    expect(invArea).toBeLessThan(originalArea);
  });

  it('should offset a closed B-spline triangle inward', () => {
    // A triangular B-spline (linear segments if degree 1, but we use degree 3)
    const bspline = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 86.6 },
      { x: 0, y: 0 }
    ];
    // For a simple polygon-like spline, we just treat it as a polygon for the offset kernel
    const inv = buildOffset(bspline, -5);
    expect(inv.length).toBe(1);
    expect(inv[0].length).toBeGreaterThan(3);

    // Check points are within bounds
    for (const p of inv[0]) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(100);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(86.6);
    }
  });

  it('should prevent cross-overs in narrow rectangles', () => {
    // Narrow 4mm rect
    const narrow = [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 100 },
        { x: 0, y: 100 },
        { x: 0, y: 0 }
    ];

    // Offset by 2.1mm inward (exceeds half-width)
    const inv = buildOffset(narrow, -2.1);
    // Should be empty or at least not have a loop that crossed over
    expect(inv.length).toBe(0);
  });
});
