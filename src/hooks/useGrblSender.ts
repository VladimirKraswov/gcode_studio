import { useState, useCallback, useRef } from "react";

export type GrblStatus = {
  connected: boolean;
  state: "Idle" | "Run" | "Hold" | "Jog" | "Alarm" | "Door" | "Check" | "Home" | "Sleep";
  pos: { x: number; y: number; z: number };
  wpos: { x: number; y: number; z: number };
  feed: number;
  spindle: number;
};

export function useGrblSender() {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [status, setStatus] = useState<GrblStatus>({
    connected: false,
    state: "Idle",
    pos: { x: 0, y: 0, z: 0 },
    wpos: { x: 0, y: 0, z: 0 },
    feed: 0,
    spindle: 0,
  });
  const [log, setLog] = useState<string[]>([]);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter | null>(null);

  const connect = useCallback(async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);

      if (!selectedPort.readable || !selectedPort.writable) {
        throw new Error("Port does not support readable/writable streams");
      }

      const reader = selectedPort.readable.getReader();
      const writer = selectedPort.writable.getWriter();
      readerRef.current = reader;
      writerRef.current = writer;

      setStatus(prev => ({ ...prev, connected: true }));

      const readLoop = async () => {
        const decoder = new TextDecoder();
        while (true) {
          try {
            const { value, done } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            setLog(prev => [...prev, text]);
            parseStatus(text);
          } catch (err) {
            console.error("Read error", err);
            break;
          }
        }
      };
      readLoop();
    } catch (err) {
      console.error("Connection failed", err);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }
    if (writerRef.current) {
      await writerRef.current.close();
      writerRef.current = null;
    }
    if (port) {
      await port.close();
      setPort(null);
    }
    setStatus(prev => ({ ...prev, connected: false }));
  }, [port]);

  const send = useCallback(async (command: string) => {
    if (!writerRef.current) return;
    const encoder = new TextEncoder();
    await writerRef.current.write(encoder.encode(command + "\n"));
    setLog(prev => [...prev, `> ${command}`]);
  }, []);

  const sendGCode = useCallback(async (gcode: string) => {
    const lines = gcode.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith(";")) {
        await send(trimmed);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }, [send]);

  const parseStatus = (data: string) => {
    const match = data.match(/<([^>]+)>/);
    if (match) {
      const parts = match[1].split("|");
      const state = parts[0] as GrblStatus["state"];
      const mposMatch = parts.find(p => p.startsWith("MPos:"))?.split(":")[1]?.split(",");
      const wposMatch = parts.find(p => p.startsWith("WPos:"))?.split(":")[1]?.split(",");
      const feedMatch = parts.find(p => p.startsWith("F:"))?.split(":")[1];
      const spindleMatch = parts.find(p => p.startsWith("S:"))?.split(":")[1];
      setStatus(prev => ({
        ...prev,
        state,
        pos: mposMatch ? { x: +mposMatch[0], y: +mposMatch[1], z: +mposMatch[2] } : prev.pos,
        wpos: wposMatch ? { x: +wposMatch[0], y: +wposMatch[1], z: +wposMatch[2] } : prev.wpos,
        feed: feedMatch ? +feedMatch : prev.feed,
        spindle: spindleMatch ? +spindleMatch : prev.spindle,
      }));
    }
  };

  return { status, log, connect, disconnect, send, sendGCode };
}