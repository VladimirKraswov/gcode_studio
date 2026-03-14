import { describe, it, expect } from 'vitest';
import { buildOffset } from './offset';
import { sampleBSpline } from '@/features/cad-editor/geometry/bspline';
import type { SketchBSpline, SketchPoint } from '@/features/cad-editor/model/types';

describe('Complex B-spline Pocketing', () => {
  it('should generate offset for a wiggly B-spline', () => {
    // Create a "wiggly" closed B-spline
    const points: SketchPoint[] = [];
    const n = 12;
    const r1 = 20;
    const r2 = 40;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const r = i % 2 === 0 ? r1 : r2;
      points.push({
        id: `p${i}`,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    const shape: SketchBSpline = {
      id: 's1',
      type: 'bspline',
      name: 'Wiggly',
      visible: true,
      groupId: null,
      controlPointIds: points.map(p => p.id),
      degree: 3,
      periodic: true,
    };

    const boundary = sampleBSpline(shape, points, 300);

    // Inward offset of 2mm
    const offset = -2;
    const loops = buildOffset(boundary, offset, "round");

    expect(loops.length).toBeGreaterThan(0);
    loops.forEach(loop => {
      expect(loop.length).toBeGreaterThan(3);
    });
  });
});
