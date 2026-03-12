// examples/pocket.ts
import { generateGCode, planPocket } from "../src";

const outer = [
  { x: 0, y: 0 },
  { x: 120, y: 0 },
  { x: 120, y: 80 },
  { x: 0, y: 80 },
  { x: 0, y: 0 },
];

const hole = [
  { x: 40, y: 25 },
  { x: 80, y: 25 },
  { x: 80, y: 55 },
  { x: 40, y: 55 },
  { x: 40, y: 25 },
];

const toolpaths = planPocket({
  contours: [outer, hole],
  tool: {
    diameter: 6,
    passDepth: 2,
    stepover: 0.4,
  },
  options: {
    name: "Pocket",
    cutZ: -4,
    strategy: "auto",
    direction: "climb",
  },
});

const gcode = generateGCode({
  toolpaths,
  machine: {
    units: "mm",
    safeZ: 5,
    startZ: 5,
    feedRapid: 2000,
    feedCut: 700,
    feedPlunge: 220,
    spindle: {
      enabled: true,
      speed: 10000,
      direction: "cw",
    },
  },
});

console.log(gcode);
