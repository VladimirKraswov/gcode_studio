import { useEffect, useRef, useState } from "react";
import type { ParsedGCode } from "@/types/gcode";

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
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!source.trim()) {
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