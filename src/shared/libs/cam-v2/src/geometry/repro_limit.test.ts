import { describe, it, expect } from 'vitest';
import { buildPocketOffsets } from './pocket';
import { Point } from '../types';

describe('Pocketing Limits', () => {
  it('should generate many loops for a large shape without hitting 50 limit', () => {
    const rect: Point[] = [
        {x: 0, y: 0},
        {x: 200, y: 0},
        {x: 200, y: 150},
        {x: 0, y: 150},
        {x: 0, y: 0}
    ];
    // Tool radius 1.5, stepover 1.0.
    // To reach center of 150mm height (75mm from edge), we need ~74 loops.
    const loops = buildPocketOffsets(rect, 1.5, 1.0);
    expect(loops.length).toBeGreaterThan(70);
  });

  it('should mill a sharp triangle completely', () => {
    const triangle: Point[] = [
        {x: 100, y: 100},
        {x: 160, y: 125},
        {x: 163, y: 48},
        {x: 100, y: 100}
    ];
    // Width approx 60, Height approx 75.
    const loops = buildPocketOffsets(triangle, 1.5, 1.0);
    expect(loops.length).toBeGreaterThan(15);
  });
});
