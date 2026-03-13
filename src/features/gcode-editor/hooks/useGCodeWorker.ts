import { useEffect, useRef, useState } from "react";
import type { ParsedGCode } from "@/types/gcode";
import { logger } from "@/shared/utils/logger";

export type { ParsedGCode };

type WorkerRequest = {
  requestId: number;
  gcodeText: string;
};

type WorkerResponse = {
  requestId: number;
  parsed: ParsedGCode;
};

export function useGCodeWorker(source: string) {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const [parsed, setParsed] = useState<ParsedGCode | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/gcodeParser.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { requestId, parsed: nextParsed } = event.data;

      if (requestId !== requestIdRef.current) {
        return;
      }

      setParsed(nextParsed);
      setIsParsing(false);

      logger.info("PARSER", "G-code parsing complete", {
        stats: nextParsed.stats,
        bounds: nextParsed.bounds,
        totalLength: nextParsed.totalLength
      });

      if (nextParsed.stats.workMoves > 0 && nextParsed.stats.cuttingMoves === 0) {
        logger.warn("PARSER", "G1 commands found but none are cutting (Z <= 0). Check tool offsets or safe height.");
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!source || !source.trim()) {
      requestIdRef.current += 1;
      setParsed(null);
      setIsParsing(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsParsing(true);

    const payload: WorkerRequest = {
      requestId,
      gcodeText: source,
    };

    workerRef.current?.postMessage(payload);
  }, [source]);

  return {
    parsed,
    isParsing,
  };
}
