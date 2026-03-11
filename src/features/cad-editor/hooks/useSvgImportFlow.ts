// path: /src/modules/cad/hooks/useSvgImportFlow.ts
import { useCallback, useRef, useState } from "react";
import { parseSvgToContours } from "../geometry/svgImport";

export type SvgImportStage = "reading" | "parsing" | "ready" | "error" | "aborted";

export type SvgImportDraft = {
  name: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  x: number;
  y: number;
  keepAspectRatio: boolean;
};

export type SvgImportReadyPayload = {
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  sourceWidth: number;
  sourceHeight: number;
  contours: Array<Array<{ x: number; y: number }>>;
};

type SvgImportState = {
  open: boolean;
  fileName: string;
  stage: SvgImportStage;
  progress: number;
  message: string;
  error: string | null;
  draft: SvgImportDraft | null;
  contours: Array<Array<{ x: number; y: number }>>;
};

type UseSvgImportFlowParams = {
  onConfirm: (payload: SvgImportReadyPayload) => void;
};

function createIdleState(): SvgImportState {
  return {
    open: false,
    fileName: "",
    stage: "reading",
    progress: 0,
    message: "",
    error: null,
    draft: null,
    contours: [],
  };
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function readFileAsText(file: File, signalRef: { aborted: boolean; reader?: FileReader }, onProgress: (value: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const fraction = event.total > 0 ? event.loaded / event.total : 0;
      onProgress(Math.max(0, Math.min(55, fraction * 55)));
    };

    reader.onerror = () => reject(new Error("Не удалось прочитать SVG файл"));
    reader.onabort = () => reject(new DOMException("Aborted", "AbortError"));

    reader.onload = () => {
      if (signalRef.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      resolve(String(reader.result ?? ""));
    };

    if (signalRef.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    reader.readAsText(file);
    signalRef.reader = reader;
  });
}

export function useSvgImportFlow({ onConfirm }: UseSvgImportFlowParams) {
  const [state, setState] = useState<SvgImportState>(createIdleState);

  const taskRef = useRef<{
    aborted: boolean;
    reader?: FileReader;
  } | null>(null);

  const close = useCallback(() => {
    if (taskRef.current) {
      taskRef.current.aborted = true;
      taskRef.current.reader?.abort();
      taskRef.current = null;
    }
    setState(createIdleState());
  }, []);

  const abort = useCallback(() => {
    if (taskRef.current) {
      taskRef.current.aborted = true;
      taskRef.current.reader?.abort();
      taskRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      stage: "aborted",
      progress: prev.progress,
      message: "Импорт был остановлен пользователем.",
      error: null,
    }));
  }, []);

  const updateDraft = useCallback((patch: Partial<SvgImportDraft>) => {
    setState((prev) => {
      if (!prev.draft) return prev;
      return {
        ...prev,
        draft: {
          ...prev.draft,
          ...patch,
        },
      };
    });
  }, []);

  const start = useCallback(async (file: File) => {
    const token = { aborted: false } as { aborted: boolean; reader?: FileReader };
    taskRef.current = token;

    const nameWithoutExt = file.name.replace(/\.svg$/i, "") || "SVG";
    setState({
      open: true,
      fileName: file.name,
      stage: "reading",
      progress: 0,
      message: "Чтение файла...",
      error: null,
      draft: null,
      contours: [],
    });

    try {
      const text = await readFileAsText(file, token, (value) => {
        setState((prev) => ({
          ...prev,
          progress: value,
          message: "Чтение SVG файла...",
        }));
      });

      if (token.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      setState((prev) => ({
        ...prev,
        stage: "parsing",
        progress: 64,
        message: "Разбор контуров SVG...",
      }));

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const parsed = parseSvgToContours(text);

      if (token.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      setState({
        open: true,
        fileName: file.name,
        stage: "ready",
        progress: 100,
        message: "SVG подготовлен. Теперь можно задать размеры и координаты.",
        error: null,
        contours: parsed.contours,
        draft: {
          name: nameWithoutExt,
          sourceWidth: round(parsed.width),
          sourceHeight: round(parsed.height),
          width: round(parsed.width),
          height: round(parsed.height),
          x: 0,
          y: 0,
          keepAspectRatio: true,
        },
      });

      taskRef.current = null;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setState((prev) => ({
          ...prev,
          open: true,
          stage: "aborted",
          message: "Импорт был остановлен пользователем.",
          error: null,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        open: true,
        stage: "error",
        progress: prev.progress,
        message: "",
        error: error instanceof Error ? error.message : "Не удалось импортировать SVG",
      }));
      taskRef.current = null;
    }
  }, []);

  const confirm = useCallback(() => {
    if (!state.draft || state.stage !== "ready") {
      return;
    }

    const payload = {
      name: state.draft.name.trim() || "SVG",
      width: state.draft.width,
      height: state.draft.height,
      x: state.draft.x,
      y: state.draft.y,
      sourceWidth: state.draft.sourceWidth,
      sourceHeight: state.draft.sourceHeight,
      contours: state.contours,
    };

    setState(createIdleState());
    onConfirm(payload);
  }, [onConfirm, state]);

  return {
    svgImport: state,
    startSvgImport: start,
    closeSvgImport: close,
    abortSvgImport: abort,
    updateSvgImportDraft: updateDraft,
    confirmSvgImport: confirm,
  };
}