import { describe, it, expect } from 'vitest';
import { buildPocketOffsets } from './pocket';
import { Point } from '../types';

describe('Narrow Pocketing', () => {
  it('should generate at least one path for a narrow rectangle', () => {
    const rect: Point[] = [
        {x: 0, y: 0},
        {x: 10, y: 0},
        {x: 10, y: 2},
        {x: 0, y: 2},
        {x: 0, y: 0}
    ];
    // Tool radius 1.0. Offset 1.0 inward is a line from (1,1) to (9,1).
    const loops = buildPocketOffsets(rect, 1.0, 0.5);
    expect(loops.length).toBeGreaterThan(0);
  });
});
