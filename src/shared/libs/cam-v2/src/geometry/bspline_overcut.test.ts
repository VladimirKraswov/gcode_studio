import { describe, it, expect } from 'vitest';
import { buildPocketOffsets } from './pocket';
import { pointInPolygon } from './offset';

describe('B-spline Pocketing Overcut Reproduction', () => {
  it('should NOT generate toolpaths outside the boundary', () => {
    // A concave shape
    const boundary = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 50, y: 50 }, // Concave vertex
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ];

    const toolRadius = 5;
    const stepover = 5;
    const offsets = buildPocketOffsets(boundary, toolRadius, stepover, false); // Disable cleanup for this test

    expect(offsets.length).toBeGreaterThan(0);

    for (const loop of offsets) {
      for (const p of loop) {
        // Point should be inside the boundary
        const isInside = pointInPolygon(p, boundary);
        if (!isInside) {
            console.log('Point outside:', p);
        }
        expect(isInside).toBe(true);
      }
    }
  });

  it('should verify the centroid-based "center cleanup" logic', () => {
      const boundary = [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 10 },
          { x: 10, y: 10 },
          { x: 10, y: 100 },
          { x: 0, y: 100 },
          { x: 0, y: 0 }
      ]; // L-shape

      const toolRadius = 2;
      const stepover = 2;
      const offsets = buildPocketOffsets(boundary, toolRadius, stepover, true);

      for (const loop of offsets) {
          for (const p of loop) {
              const isInside = pointInPolygon(p, boundary);
              if (!isInside) {
                  console.log('Cleanup point outside:', p);
              }
              expect(isInside).toBe(true);
          }
      }
  });
});
