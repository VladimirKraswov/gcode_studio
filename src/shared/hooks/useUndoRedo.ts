import { useCallback, useMemo, useState } from "react";

type SetStateAction<T> = T | ((prev: T) => T);

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

type SetStateOptions = {
  record?: boolean;
};

function resolveState<T>(action: SetStateAction<T>, prev: T): T {
  return typeof action === "function"
    ? (action as (value: T) => T)(prev)
    : action;
}

export function useUndoRedo<T>(initialState: T, limit = 5) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback(
    (action: SetStateAction<T>, options: SetStateOptions = {}) => {
      const { record = true } = options;

      setHistory((prev) => {
        const nextPresent = resolveState(action, prev.present);

        if (Object.is(nextPresent, prev.present)) {
          return prev;
        }

        if (!record) {
          return {
            ...prev,
            present: nextPresent,
          };
        }

        return {
          past: [...prev.past, prev.present].slice(-limit),
          present: nextPresent,
          future: [],
        };
      });
    },
    [limit],
  );

  /**
   * Сохраняет текущий snapshot в undo-стек,
   * но не меняет present.
   * Это удобно перед drag/pan, когда дальше идут "тихие" обновления.
   */
  const checkpoint = useCallback(() => {
    setHistory((prev) => {
      const lastPast = prev.past[prev.past.length - 1];
      if (Object.is(lastPast, prev.present)) {
        return prev;
      }

      return {
        past: [...prev.past, prev.present].slice(-limit),
        present: prev.present,
        future: [],
      };
    });
  }, [limit]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) {
        return prev;
      }

      const previous = prev.past[prev.past.length - 1];

      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future].slice(0, limit),
      };
    });
  }, [limit]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) {
        return prev;
      }

      const next = prev.future[0];

      return {
        past: [...prev.past, prev.present].slice(-limit),
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, [limit]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return useMemo(
    () => ({
      state: history.present,
      setState,
      checkpoint,
      undo,
      redo,
      canUndo,
      canRedo,
    }),
    [history.present, setState, checkpoint, undo, redo, canUndo, canRedo],
  );
}