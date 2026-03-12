import { generateGCode, planProfile } from "../src";

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
  { x: 0, y: 0 },
];

const toolpaths = planProfile({
  contour: square,
  operation: "profile-outside",
  tool: {
    diameter: 6,
    passDepth: 2,
    stepover: 0.45,
  },
  options: {
    name: "Outer Profile",
    cutZ: -6,
    direction: "climb",
    tabs: {
      enabled: true,
      count: 4,
      width: 6,
      height: 1,
    },
    ramping: {
      enabled: true,
      turns: 2,
    },
  },
});

const gcode = generateGCode({
  toolpaths,
  machine: {
    units: "mm",
    safeZ: 5,
    startZ: 5,
    feedRapid: 2000,
    feedCut: 800,
    feedPlunge: 250,
    workOffset: "G54",
    toolNumber: 1,
    spindle: {
      enabled: true,
      speed: 12000,
      direction: "cw",
      dwellMs: 300,
    },
    coolant: false,
    returnHome: true,
  },
});

console.log(gcode);