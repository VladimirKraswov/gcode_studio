import { describe, it, expect } from 'vitest';
import { buildPocketOffsets } from './pocket';

describe('B-spline Pocketing Reproduction', () => {
  it('should FAIL to handle a nearly-closed B-spline with current logic', () => {
    // Current normalizeClosed uses 1e-6 threshold.
    // BSpline sampling uses 0.001 threshold for closure.
    // If BSpline returns points with a 0.0005 gap, normalizeClosed in pocket.ts won't close it.
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0.0005 } // Gap > 1e-6 but < 1e-3
    ];

    const toolRadius = 1;
    const stepover = 0.5;

    const offsets = buildPocketOffsets(points, toolRadius, stepover);

    // If it's treated as open, and buildOffset is called on it,
    // it might return empty because buildOffset calls closeLoop which might add a point,
    // but the input to buildOffset should ideally be closed if we want a pocket.
    // Actually buildOffset calls closeLoop(dedupeSequential(polyline)).
    // closeLoop(points) will add {x:0, y:0} if last is {x:0, y:0.0005}.

    // However, if the contour is NOT closed, pocketing might be unpredictable.
    expect(offsets.length).toBeGreaterThan(0);
  });

  it('should verify CCW/CW orientation issues', () => {
     const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0 }
    ];
    // This is CCW.

    const toolRadius = 1;
    const stepover = 0.5;
    const offsets = buildPocketOffsets(points, toolRadius, stepover);

    // buildOffset returns CCW loops for valid offsets.
    for (const loop of offsets) {
        let area = 0;
        for (let i = 0; i < loop.length - 1; i++) {
            area += loop[i].x * loop[i+1].y - loop[i+1].x * loop[i].y;
        }
        expect(area).toBeGreaterThan(0); // Should be CCW
    }
  });

  it('should check for gaps in offset loops', () => {
      // Create a shape that might cause issues for the offsetter
      const points = [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 5, y: 1 }, // Concave point
          { x: 10, y: 10 },
          { x: 0, y: 10 },
          { x: 0, y: 0 }
      ];
      const offsets = buildPocketOffsets(points, 2, 1);
      expect(offsets.length).toBeGreaterThan(0);
      for (const loop of offsets) {
          // Check if loop is closed
          const first = loop[0];
          const last = loop[loop.length - 1];
          expect(Math.hypot(first.x - last.x, first.y - last.y)).toBeLessThan(1e-3);
      }
  });
});
