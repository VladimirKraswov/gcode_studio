import type {
  MotionMode,
  ParsedGCode,
  Point3,
  Segment,
  ToolPoint,
} from "../types/gcode";

const MAX_RENDER_SEGMENTS = 25_000;

type WorkerRequest = {
  requestId: number;
  gcodeText: string;
};

type WorkerResponse = {
  requestId: number;
  parsed: ParsedGCode;
};

function stripComments(line: string): string {
  return line.split(";")[0].replace(/\([^)]*\)/g, "").trim();
}

function getWord(line: string, word: string): number | null {
  const match = line.match(new RegExp(`${word}(-?\\d*\\.?\\d+)`, "i"));
  return match ? Number(match[1]) : null;
}

function getGCodes(line: string): string[] {
  return [...line.matchAll(/G(\d+(?:\.\d+)?)/gi)].map((match) => match[1]);
}

function lengthBetween(start: Point3, end: Point3): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function parseGCode(text: string): ParsedGCode {
  const safeText = typeof text === "string" ? text : "";
  const lines = safeText.split(/\r?\n/);

  let absoluteMode = true;
  let unitScale = 1;
  let lastMotionMode: MotionMode | null = null;
  let state: ToolPoint = { x: 0, y: 0, z: 0, f: 0 };

  const segments: Segment[] = [];
  const points: Point3[] = [{ x: 0, y: 0, z: 0 }];

  let rapidMoves = 0;
  let workMoves = 0;
  let cuttingMoves = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const line = stripComments(raw);

    if (!line) {
      continue;
    }

    const upperLine = line.toUpperCase();
    const gCodes = getGCodes(upperLine);

    if (gCodes.includes("20")) unitScale = 25.4;
    if (gCodes.includes("21")) unitScale = 1;
    if (gCodes.includes("90")) absoluteMode = true;
    if (gCodes.includes("91")) absoluteMode = false;

    let motionMode: MotionMode | null = null;

    if (gCodes.includes("0") || gCodes.includes("00")) {
      motionMode = "G0";
    }
    if (gCodes.includes("1") || gCodes.includes("01")) {
      motionMode = "G1";
    }

    if (motionMode) {
      lastMotionMode = motionMode;
    }

    const xWord = getWord(line, "X");
    const yWord = getWord(line, "Y");
    const zWord = getWord(line, "Z");
    const fWord = getWord(line, "F");

    const hasMove = xWord !== null || yWord !== null || zWord !== null;

    if (!hasMove) {
      if (fWord !== null) {
        state.f = fWord;
      }
      continue;
    }

    const effectiveMode = motionMode || lastMotionMode;
    if (!effectiveMode) {
      continue;
    }

    const next: ToolPoint = { ...state };

    if (xWord !== null) {
      next.x = absoluteMode ? xWord * unitScale : state.x + xWord * unitScale;
    }
    if (yWord !== null) {
      next.y = absoluteMode ? yWord * unitScale : state.y + yWord * unitScale;
    }
    if (zWord !== null) {
      next.z = absoluteMode ? zWord * unitScale : state.z + zWord * unitScale;
    }
    if (fWord !== null) {
      next.f = fWord;
    }

    const moved = next.x !== state.x || next.y !== state.y || next.z !== state.z;
    if (!moved) {
      continue;
    }

    const isCutting = next.z <= 0 || state.z <= 0;

    const segment: Segment = {
      id: segments.length,
      mode: effectiveMode,
      start: { ...state },
      end: { ...next },
      feed: next.f,
      lineNumber: i + 1,
      raw,
      isCutting,
    };

    segments.push(segment);
    points.push({ x: next.x, y: next.y, z: next.z });

    if (effectiveMode === "G0") rapidMoves += 1;
    else workMoves += 1;

    if (isCutting) cuttingMoves += 1;

    state = next;
  }

  let minX = points[0]?.x ?? 0;
  let maxX = points[0]?.x ?? 0;
  let minY = points[0]?.y ?? 0;
  let maxY = points[0]?.y ?? 0;
  let minZ = points[0]?.z ?? 0;
  let maxZ = points[0]?.z ?? 0;

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
    if (point.z < minZ) minZ = point.z;
    if (point.z > maxZ) maxZ = point.z;
  }

  let totalLength = 0;
  const cumulativeLengths = segments.map((segment) => {
    totalLength += lengthBetween(segment.start, segment.end);
    return totalLength;
  });

  const renderStep = Math.max(1, Math.ceil(segments.length / MAX_RENDER_SEGMENTS));
  const renderSegments =
    renderStep === 1
      ? segments
      : segments.filter(
          (_segment, index) => index % renderStep === 0 || index === segments.length - 1,
        );

  return {
    segments,
    renderSegments,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ },
    cumulativeLengths,
    totalLength,
    stats: {
      totalLines: lines.length,
      totalMoves: segments.length,
      rapidMoves,
      workMoves,
      cuttingMoves,
      renderMoves: renderSegments.length,
      renderStep,
    },
  };
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const result: WorkerResponse = {
    requestId: event.data.requestId,
    parsed: parseGCode(event.data.gcodeText),
  };

  self.postMessage(result);
};