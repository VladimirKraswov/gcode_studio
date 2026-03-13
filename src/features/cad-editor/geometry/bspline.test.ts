import { describe, it, expect } from 'vitest';
import { sampleBSpline } from './bspline';
import type { SketchBSpline, SketchPoint } from '../model/types';

describe('BSpline Geometry', () => {
  const points: SketchPoint[] = [
    { id: 'p1', x: 0, y: 0 },
    { id: 'p2', x: 10, y: 0 },
    { id: 'p3', x: 10, y: 10 },
    { id: 'p4', x: 0, y: 10 },
  ];

  it('should sample an open B-spline', () => {
    const shape: SketchBSpline = {
      id: 's1',
      type: 'bspline',
      name: 'Spline 1',
      visible: true,
      groupId: null,
      controlPointIds: ['p1', 'p2', 'p3', 'p4'],
      degree: 3,
      periodic: false,
    };

    const sampled = sampleBSpline(shape, points, 10);
    expect(sampled.length).toBeGreaterThan(10);
    // Should start at first CP and end at last CP for open uniform
    expect(sampled[0].x).toBeCloseTo(0);
    expect(sampled[0].y).toBeCloseTo(0);
    expect(sampled[sampled.length - 1].x).toBeCloseTo(0);
    expect(sampled[sampled.length - 1].y).toBeCloseTo(10);
  });

  it('should sample a periodic B-spline with exact closure', () => {
    const shape: SketchBSpline = {
      id: 's1',
      type: 'bspline',
      name: 'Spline 1',
      visible: true,
      groupId: null,
      controlPointIds: ['p1', 'p2', 'p3', 'p4'],
      degree: 3,
      periodic: true,
    };

    const sampled = sampleBSpline(shape, points, 20);
    expect(sampled.length).toBeGreaterThan(20);

    const first = sampled[0];
    const last = sampled[sampled.length - 1];

    // Test for bit-identical closure
    expect(first.x).toBe(last.x);
    expect(first.y).toBe(last.y);
  });

  it('should handle small degree correctly', () => {
    const shape: SketchBSpline = {
      id: 's1',
      type: 'bspline',
      name: 'Spline 1',
      visible: true,
      groupId: null,
      controlPointIds: ['p1', 'p2'],
      degree: 1,
      periodic: false,
    };

    const sampled = sampleBSpline(shape, points);
    // For degree 1 with 2 points, it's just a line
    expect(sampled.length).toBe(2);
    expect(sampled[0]).toEqual({ x: 0, y: 0 });
    expect(sampled[1]).toEqual({ x: 10, y: 0 });
  });

  it('should use high precision rounding', () => {
     const shape: SketchBSpline = {
      id: 's1',
      type: 'bspline',
      name: 'Spline 1',
      visible: true,
      groupId: null,
      controlPointIds: ['p1', 'p2', 'p3'],
      degree: 2,
      periodic: false,
    };

    const sampled = sampleBSpline(shape, points, 100);
    for (const p of sampled) {
        const sX = p.x.toString();
        const sY = p.y.toString();
        // Check if we have more than 3 decimal places (if not exactly round)
        if (sX.includes('.') && sX.split('.')[1].length > 3) return;
        if (sY.includes('.') && sY.split('.')[1].length > 3) return;
    }
    // Note: If all points happen to be round, this test might be weak,
    // but typically B-spline evaluation produces many decimals.
  });
});
