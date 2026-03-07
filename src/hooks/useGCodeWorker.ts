import { useEffect, useRef, useState } from "react";
import type { ParsedGCode } from "../types/gcode";

export function useGCodeWorker(source: string) {
  const workerRef = useRef<Worker | null>(null);
  const [parsed, setParsed] = useState<ParsedGCode | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/gcodeParser.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<ParsedGCode>) => {
      setParsed(event.data);
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
      setParsed(null);
      setIsParsing(false);
      return;
    }

    setIsParsing(true);
    workerRef.current?.postMessage({ gcodeText: source });
  }, [source]);

  return {
    parsed,
    isParsing,
  };
}