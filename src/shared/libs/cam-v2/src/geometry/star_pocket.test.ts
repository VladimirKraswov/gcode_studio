import { describe, it, expect } from 'vitest';
import { buildOffset } from './offset';
import { Point } from '../types';

describe('Star Shape Pocketing', () => {
  it('should generate valid inward offsets for a 10-pointed star', () => {
    const points: Point[] = [];
    const n = 20; // 10 points * 2 (inner/outer)
    const rOuter = 50;
    const rInner = 20;

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const r = i % 2 === 0 ? rOuter : rInner;
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    // Inward offset of 5mm
    const loops = buildOffset(points, -5, "round");

    expect(loops.length).toBe(1);
    expect(loops[0].length).toBeGreaterThan(10);
  });
});
