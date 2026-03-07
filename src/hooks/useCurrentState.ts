import { useMemo } from "react";
import type { CurrentState, ParsedGCode } from "../types/gcode";
import { clamp } from "../utils";

const EMPTY_STATE: CurrentState = {
  index: -1,
  position: { x: 0, y: 0, z: 0 },
  mode: "-",
  lineNumber: 0,
  segment: null,
};

export function useCurrentState(parsed: ParsedGCode | null, progress: number): CurrentState {
  return useMemo(() => {
    if (!parsed || parsed.segments.length === 0) {
      return EMPTY_STATE;
    }

    const { segments, cumulativeLengths, totalLength } = parsed;

    if (progress <= 0) {
      const first = segments[0];
      return {
        index: 0,
        position: { ...first.start },
        mode: first.mode,
        lineNumber: first.lineNumber,
        segment: first,
      };
    }

    if (totalLength <= 0 || progress >= 100) {
      const last = segments[segments.length - 1];
      return {
        index: segments.length - 1,
        position: { ...last.end },
        mode: last.mode,
        lineNumber: last.lineNumber,
        segment: last,
      };
    }

    const target = (progress / 100) * totalLength;

    let left = 0;
    let right = cumulativeLengths.length - 1;
    let foundIndex = right;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (target <= cumulativeLengths[mid]) {
        foundIndex = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    const seg = segments[foundIndex];
    const prevTotal = foundIndex === 0 ? 0 : cumulativeLengths[foundIndex - 1];
    const segLength = Math.max(cumulativeLengths[foundIndex] - prevTotal, 0.000001);
    const t = clamp((target - prevTotal) / segLength, 0, 1);

    return {
      index: foundIndex,
      position: {
        x: seg.start.x + (seg.end.x - seg.start.x) * t,
        y: seg.start.y + (seg.end.y - seg.start.y) * t,
        z: seg.start.z + (seg.end.z - seg.start.z) * t,
      },
      mode: seg.mode,
      lineNumber: seg.lineNumber,
      segment: seg,
    };
  }, [parsed, progress]);
}