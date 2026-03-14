import { describe, it, expect } from 'vitest';
import { buildOffset } from './offset';
import { Point } from '../types';

describe('Sharp Triangle Offset', () => {
  it('should continue offsetting a sharp triangle', () => {
    // A sharp triangle
    const triangle: Point[] = [
        {x: 0, y: 0},
        {x: 100, y: 10},
        {x: 0, y: 20},
        {x: 0, y: 0}
    ];

    // Inward offset. Width is 20 at base, 0 at tip.
    // At 5mm offset, it should still have a significant "inside".
    const loops = buildOffset(triangle, -5, "round");
    expect(loops.length).toBe(1);

    // At 9mm offset, it's very thin.
    const loops2 = buildOffset(triangle, -9, "round");
    expect(loops2.length).toBe(1);
  });
});
