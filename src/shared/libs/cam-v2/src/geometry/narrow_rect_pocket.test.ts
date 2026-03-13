import { describe, it, expect } from 'vitest';
import { buildPocketOffsets } from './pocket';

describe('Narrow Rectangle Pocketing Reproduction', () => {
  it('should NOT generate toolpaths for narrow rectangle that exceed its bounds', () => {
    // Narrow vertical rectangle: 4mm wide, 100mm high
    const boundary = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 100 },
      { x: 0, y: 100 },
      { x: 0, y: 0 }
    ];

    const toolRadius = 3.175 / 2; // ~1.5875
    const stepover = 1.0;

    // Iteration 1: offset = 1.5875 (fits, remaining width ~0.825)
    // Iteration 2: offset = 2.5875 (should NOT fit, as 2.5875 * 2 > 4)
    const offsets = buildPocketOffsets(boundary, toolRadius, stepover, false);

    console.log('Generated loops:', offsets.length);
    for (let i = 0; i < offsets.length; i++) {
        const loop = offsets[i];
        const minX = Math.min(...loop.map(p => p.x));
        const maxX = Math.max(...loop.map(p => p.x));
        const minY = Math.min(...loop.map(p => p.y));
        const maxY = Math.max(...loop.map(p => p.y));

        console.log(`Loop ${i}: X bounds [${minX}, ${maxX}], Y bounds [${minY}, ${maxY}]`);

        // Loop bounds should be strictly within original bounds
        expect(minX).toBeGreaterThanOrEqual(0);
        expect(maxX).toBeLessThanOrEqual(4);
        expect(minY).toBeGreaterThanOrEqual(0);
        expect(maxY).toBeLessThanOrEqual(100);

        // If it "flipped", width (maxX - minX) might become large (e.g. 100) or orientation might change
    }

    // For a 4mm wide rect and 1.5875 tool radius:
    // Only 1 loop should be possible before it collapses.
    expect(offsets.length).toBeLessThanOrEqual(2);
  });
});
