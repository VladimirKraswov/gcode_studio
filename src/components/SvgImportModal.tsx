import { useEffect, useMemo } from "react";
import {
  FiAlertCircle,
  FiLoader,
  FiSlash,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { theme, ui } from "../styles/ui";

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

  return (
    <div
      style={overlayStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={ui.iconBadge}>
              {isBusy ? (
                <FiLoader
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <FiUploadCloud size={18} />
              )}
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>
                Импорт SVG
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
              >
                {fileName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            title="Закрыть"
          >
            <FiX size={18} />
          </button>
        </div>

        {(isBusy || stage === "error" || stage === "aborted") && (
          <div style={{ ...ui.panelInset, padding: 16, marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              {stage === "error" ? (
                <FiAlertCircle size={18} color={theme.danger} />
              ) : stage === "aborted" ? (
                <FiSlash size={18} color={theme.warning} />
              ) : (
                <FiLoader
                  size={18}
                  color={theme.primary}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              )}

              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>
                {stage === "error"
                  ? "Ошибка импорта"
                  : stage === "aborted"
                    ? "Импорт прерван"
                    : "Загрузка и обработка SVG"}
              </div>
            </div>

            <div
              style={{
                height: 12,
                borderRadius: 999,
                background: "#e2e8f0",
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: `${clampProgress(progress)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background:
                    stage === "error"
                      ? "linear-gradient(90deg, #fb7185 0%, #e11d48 100%)"
                      : stage === "aborted"
                        ? "linear-gradient(90deg, #fbbf24 0%, #d97706 100%)"
                        : "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)",
                  transition: "width 160ms ease",
                }}
              />
            </div>

            <div style={{ fontSize: 13, color: theme.textSoft, lineHeight: 1.5 }}>
              {error ?? message}
            </div>

            {isBusy && (
              <div style={{ marginTop: 14 }}>
                <button type="button" onClick={onAbort} style={ui.buttonDanger}>
                  <FiSlash size={16} />
                  Abort
                </button>
              </div>
            )}
          </div>
        )}

        {canEdit && draft && (
          <>
            <div
              style={{
                ...ui.panelInset,
                padding: 14,
                marginBottom: 14,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>
                Исходный размер SVG
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <Stat label="Ширина" value={String(draft.sourceWidth)} />
                <Stat label="Высота" value={String(draft.sourceHeight)} />
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={ui.inputLabel}>
                Имя объекта
                <input
                  style={ui.input}
                  type="text"
                  value={draft.name}
                  onChange={(e) => onChangeDraft({ name: e.target.value })}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <label style={ui.inputLabel}>
                  Ширина
                  <input
                    style={ui.input}
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

                <label style={ui.inputLabel}>
                  Высота
                  <input
                    style={ui.input}
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

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${theme.border}`,
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  color: theme.text,
                }}
              >
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <label style={ui.inputLabel}>
                  X
                  <input
                    style={ui.input}
                    type="number"
                    step="0.001"
                    value={draft.x}
                    onChange={(e) =>
                      onChangeDraft({ x: Number(e.target.value) || 0 })
                    }
                  />
                </label>

                <label style={ui.inputLabel}>
                  Y
                  <input
                    style={ui.input}
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

        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={ui.buttonGhost}>
            Закрыть
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              ...ui.buttonPrimary,
              opacity: canConfirm ? 1 : 0.55,
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={ui.statCard}>
      <div style={ui.statLabel}>{label}</div>
      <div style={{ ...ui.statValue, fontSize: 16 }}>{value}</div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(15, 23, 42, 0.42)",
  backdropFilter: "blur(6px)",
  display: "grid",
  placeItems: "center",
  padding: 24,
};

const modalStyle: React.CSSProperties = {
  width: "min(680px, 100%)",
  maxHeight: "min(88vh, 920px)",
  overflowY: "auto",
  background: "#fff",
  borderRadius: 24,
  border: `1px solid ${theme.border}`,
  boxShadow: theme.shadow,
  padding: 18,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 18,
};

const closeButtonStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  background: "#fff",
  color: theme.text,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};