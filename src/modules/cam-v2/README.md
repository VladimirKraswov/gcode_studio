## README.md

````md
# @gcode-studio/cam

Independent TypeScript CAM kernel for 2D toolpath planning and G-code generation.

## Features

- independent from CAD editor internals
- profile inside / outside
- follow-path
- pocketing with auto strategy
- travel optimization
- multi-pass depth planning
- tabs / bridges
- ramping entry
- TypeScript-first API

## Installation

```bash
npm install @gcode-studio/cam
````

## Quick start

```ts
import { planProfile, generateGCode } from "@gcode-studio/cam";

const contour = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
  { x: 0, y: 0 },
];

const toolpaths = planProfile({
  contour,
  operation: "profile-outside",
  tool: {
    diameter: 6,
    passDepth: 2,
    stepover: 0.45,
  },
  options: {
    cutZ: -6,
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
    spindle: {
      enabled: true,
      speed: 12000,
      direction: "cw",
    },
  },
});
```

## API

### `planProfile(input)`

Plans:

* `follow-path`
* `profile-inside`
* `profile-outside`

### `planPocket(input)`

Pocket strategies:

* `auto`
* `offset`
* `parallel`

### `generateGCode(input)`

Generates G-code from prepared toolpaths.

## Build

```bash
npm install
npm run build
```

## Examples

```bash
npm run example:profile
npm run example:pocket
```
