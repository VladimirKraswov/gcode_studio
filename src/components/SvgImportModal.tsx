import { useEffect, useMemo } from "react";
import {
  FiAlertCircle,
  FiLoader,
  FiSlash,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

export type SvgImportStage =
  | "reading"
  | "parsing"
  | "ready"
  | "error"
  | "aborted";

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

type SvgImportModalProps = {
  open: boolean;
  fileName: string;
  stage: SvgImportStage;
  progress: number;
  message: string;
  error: string | null;
  draft: SvgImportDraft | null;
  onClose: () => void;
  onAbort: () => void;
  onChangeDraft: (patch: Partial<SvgImportDraft>) => void;
  onConfirm: () => void;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-stat-card">
      <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="text-base font-extrabold text-[var(--color-text)]">{value}</div>
    </div>
  );
}

export function SvgImportModal({
  open,
  fileName,
  stage,
  progress,
  message,
  error,
  draft,
  onClose,
  onAbort,
  onChangeDraft,
  onConfirm,
}: SvgImportModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const ratio = useMemo(() => {
    if (!draft || draft.sourceWidth <= 0 || draft.sourceHeight <= 0) return 1;
    return draft.sourceWidth / draft.sourceHeight;
  }, [draft]);

  if (!open) return null;

  const isBusy = stage === "reading" || stage === "parsing";
  const canEdit = stage === "ready" && draft;
  const canConfirm = stage === "ready" && Boolean(draft);

  const progressBarClass =
    stage === "error"
      ? "bg-[var(--color-danger)]"
      : stage === "aborted"
        ? "bg-[var(--color-warning)]"
        : "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-primary-text)_100%)]";

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-[rgba(15,23,42,0.42)] p-6 backdrop-blur-[6px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[680px] max-h-[88vh] overflow-y-auto rounded-[24px] border border-[var(--color-border)] bg-[var(--color-panel-solid)] p-[18px] shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
              {isBusy ? (
                <FiLoader size={18} className="animate-spin" />
              ) : (
                <FiUploadCloud size={18} />
              )}
            </div>

            <div>
              <div className="text-lg font-extrabold text-[var(--color-text)]">
                Импорт SVG
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {fileName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Закрыть"
            className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-solid)] text-[var(--color-text)]"
          >
            <FiX size={18} />
          </button>
        </div>

        {(isBusy || stage === "error" || stage === "aborted") && (
          <div className="ui-panel-inset mb-3.5 p-4">
            <div className="mb-3 flex items-center gap-2.5">
              {stage === "error" ? (
                <FiAlertCircle size={18} className="text-[var(--color-danger)]" />
              ) : stage === "aborted" ? (
                <FiSlash size={18} className="text-[var(--color-warning)]" />
              ) : (
                <FiLoader size={18} className="animate-spin text-[var(--color-primary)]" />
              )}

              <div className="text-sm font-bold text-[var(--color-text)]">
                {stage === "error"
                  ? "Ошибка импорта"
                  : stage === "aborted"
                    ? "Импорт прерван"
                    : "Загрузка и обработка SVG"}
              </div>
            </div>

            <div className="mb-2.5 h-3 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className={`h-full rounded-full transition-[width] duration-150 ease-in-out ${progressBarClass}`}
                style={{ width: `${clampProgress(progress)}%` }}
              />
            </div>

            <div className="text-[13px] leading-6 text-[var(--color-text-soft)]">
              {error ?? message}
            </div>

            {isBusy && (
              <div className="mt-3.5">
                <button type="button" onClick={onAbort} className="ui-btn-danger">
                  <FiSlash size={16} />
                  Abort
                </button>
              </div>
            )}
          </div>
        )}

        {canEdit && draft && (
          <>
            <div className="ui-panel-inset mb-3.5 grid gap-3 p-3.5">
              <div className="text-[13px] font-extrabold text-[var(--color-text)]">
                Исходный размер SVG
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="Ширина" value={String(draft.sourceWidth)} />
                <Stat label="Высота" value={String(draft.sourceHeight)} />
              </div>
            </div>

            <div className="grid gap-3">
              <label className="ui-label">
                Имя объекта
                <input
                  className="ui-input"
                  type="text"
                  value={draft.name}
                  onChange={(e) => onChangeDraft({ name: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="ui-label">
                  Ширина
                  <input
                    className="ui-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={draft.width}
                    onChange={(e) => {
                      const nextWidth = Math.max(
                        0.001,
                        Number(e.target.value) || 0.001,
                      );
                      if (draft.keepAspectRatio) {
                        onChangeDraft({
                          width: nextWidth,
                          height: Number((nextWidth / ratio).toFixed(3)),
                        });
                      } else {
                        onChangeDraft({ width: nextWidth });
                      }
                    }}
                  />
                </label>

                <label className="ui-label">
                  Высота
                  <input
                    className="ui-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={draft.height}
                    onChange={(e) => {
                      const nextHeight = Math.max(
                        0.001,
                        Number(e.target.value) || 0.001,
                      );
                      if (draft.keepAspectRatio) {
                        onChangeDraft({
                          height: nextHeight,
                          width: Number((nextHeight * ratio).toFixed(3)),
                        });
                      } else {
                        onChangeDraft({ height: nextHeight });
                      }
                    }}
                  />
                </label>
              </div>

              <label className="flex items-center gap-2.5 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-panel-solid)] p-3 text-[13px] font-bold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={draft.keepAspectRatio}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked) {
                      onChangeDraft({ keepAspectRatio: false });
                      return;
                    }

                    onChangeDraft({
                      keepAspectRatio: true,
                      height: Number((draft.width / ratio).toFixed(3)),
                    });
                  }}
                />
                Пропорциональное масштабирование
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="ui-label">
                  X
                  <input
                    className="ui-input"
                    type="number"
                    step="0.001"
                    value={draft.x}
                    onChange={(e) =>
                      onChangeDraft({ x: Number(e.target.value) || 0 })
                    }
                  />
                </label>

                <label className="ui-label">
                  Y
                  <input
                    className="ui-input"
                    type="number"
                    step="0.001"
                    value={draft.y}
                    onChange={(e) =>
                      onChangeDraft({ y: Number(e.target.value) || 0 })
                    }
                  />
                </label>
              </div>
            </div>
          </>
        )}

        <div className="mt-[18px] flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="ui-btn-ghost">
            Закрыть
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="ui-btn-primary disabled:cursor-not-allowed disabled:opacity-55"
          >
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}