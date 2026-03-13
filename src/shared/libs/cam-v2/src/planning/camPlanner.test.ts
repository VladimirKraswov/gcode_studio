import { describe, it, expect } from 'vitest';
import { planProfile, planPocket } from './camPlanner';
import type { ProfilePlanInput, PocketPlanInput } from '../types';

describe('CAM Planner', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
    { x: 0, y: 0 }
  ];

  it('should orient profile toolpaths based on milling direction', () => {
    const tool = { diameter: 2, passDepth: 1, stepover: 0.5 };

    const inputClimb: ProfilePlanInput = {
      contour: square,
      operation: 'profile-outside',
      tool,
      options: { cutZ: -1, direction: 'climb' }
    };

    const toolpathsClimb = planProfile(inputClimb);
    expect(toolpathsClimb.length).toBe(1);
    // Outside + Climb = CCW for a CCW source.
    // Our source square is CCW.
    // planProfile calls orientPath(loop, true, false, false) for climb.
    // Inside orientPath: CCW is wantCCW if !insideLike and !wantConventional.

    // Let's check area
    let area = 0;
    const pts = toolpathsClimb[0].points;
    for (let i = 0; i < pts.length - 1; i++) {
        area += pts[i].x * pts[i+1].y - pts[i+1].x * pts[i].y;
    }
    expect(area).toBeGreaterThan(0); // CCW

    const inputConv: ProfilePlanInput = {
      contour: square,
      operation: 'profile-outside',
      tool,
      options: { cutZ: -1, direction: 'conventional' }
    };
    const toolpathsConv = planProfile(inputConv);
    let areaConv = 0;
    const ptsConv = toolpathsConv[0].points;
    for (let i = 0; i < ptsConv.length - 1; i++) {
        areaConv += ptsConv[i].x * ptsConv[i+1].y - ptsConv[i+1].x * ptsConv[i].y;
    }
    expect(areaConv).toBeLessThan(0); // CW
  });

  it('should orient pocket toolpaths correctly (Climb = CW)', () => {
      const input: PocketPlanInput = {
          contours: [square],
          tool: { diameter: 1, passDepth: 1, stepover: 0.5 },
          options: { cutZ: -5, direction: 'climb' }
      };

      const toolpaths = planPocket(input);
      expect(toolpaths.length).toBeGreaterThan(0);

      // For internal pockets, Climb is CW.
      let area = 0;
      const pts = toolpaths[0].points;
      for (let i = 0; i < pts.length - 1; i++) {
          area += pts[i].x * pts[i+1].y - pts[i+1].x * pts[i].y;
      }
      expect(area).toBeLessThan(0); // CW
  });
});
