import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorSelection } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import type { StringStream } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
  FiCheck,
  FiCommand,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { downloadTextFile } from "@/shared/utils/common";
import { useTheme } from "@/shared/hooks/useTheme";
import { lightEditorTheme, darkEditorTheme } from "@/styles/editorThemes";

type GCodeEditorProps = {
  source: string;
  setSource: (src: string) => void;
  fileName: string;
  variant?: "panel" | "tab";
  onClose?: () => void;
  title?: string;
};

const COMMON_COMMANDS = [
  "G0",
  "G1",
  "G2",
  "G3",
  "G4 P",
  "G17",
  "G18",
  "G19",
  "G20",
  "G21",
  "G28",
  "G90",
  "G91",
  "M3",
  "M5",
  "M6 T",
  "S1000",
  "F300",
];

const gcodeLanguage = StreamLanguage.define({
  token: (stream: StringStream) => {
    if (stream.eatSpace()) return null;

    if (stream.match(/^;.*/)) return "comment";
    if (stream.match(/^[Nn]\d+/)) return "atom";
    if (stream.match(/^[GgMmTtSsFfPpLl]\d+(\.\d+)?/)) return "keyword";
    if (stream.match(/^[XYZIJKABCUWV]\s*[+-]?\d*\.?\d+/)) return "variableName";
    if (stream.match(/^[+-]?\d*\.?\d+/)) return "number";

    stream.next();
    return null;
  },
});

const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#7f8c8d", fontStyle: "italic" },
  { tag: tags.keyword, color: "#c678dd" },
  { tag: tags.variableName, color: "#61afef" },
  { tag: tags.number, color: "#d19a66" },
  { tag: tags.atom, color: "#e5c07b" },
]);

export function GCodeEditor({
  source,
  setSource,
  fileName,
  variant = "panel",
  onClose,
  title = "Редактор G-code",
}: GCodeEditorProps) {
  const { isDark } = useTheme();
  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const localValueRef = useRef(source);

  const [editorValue, setEditorValue] = useState(source);
  const [isDirty, setIsDirty] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  useEffect(() => {
    if (!isDirty) {
      localValueRef.current = source;
      setEditorValue(source);
    }
  }, [source, isDirty]);

  const handleSave = useCallback(() => {
    const outputName = fileName.replace(/\.gcode$/i, "") + "_edited.gcode";
    downloadTextFile(localValueRef.current, outputName);
  }, [fileName]);

  const extensions = useMemo(() => {
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      EditorView.lineWrapping,
      EditorView.editable.of(true),
      gcodeLanguage,
      syntaxHighlighting(oneDarkHighlightStyle),
      isDark ? darkEditorTheme : lightEditorTheme,
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            handleSave();
            return true;
          },
        },
      ]),
    ];
  }, [handleSave, isDark]);

  const handleChange = useCallback((value: string) => {
    localValueRef.current = value;
    setEditorValue(value);
    setIsDirty(true);
  }, []);

  const handleApply = useCallback(() => {
    setSource(localValueRef.current);
    setIsDirty(false);
    editorRef.current?.view?.focus();
  }, [setSource]);

  const handleReset = useCallback(() => {
    localValueRef.current = source;
    setEditorValue(source);
    setIsDirty(false);
    editorRef.current?.view?.focus();
  }, [source]);

  const handleClear = useCallback(() => {
    localValueRef.current = "";
    setEditorValue("");
    setIsDirty(true);
    editorRef.current?.view?.focus();
  }, []);

  const insertTextAtCursor = useCallback((textToInsert: string) => {
    const view = editorRef.current?.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const from = selection.from;
    const to = selection.to;

    const prevChar = from > 0 ? view.state.doc.sliceString(from - 1, from) : "";
    const nextChar = view.state.doc.sliceString(to, to + 1);

    const needsLeadingBreak = from > 0 && prevChar !== "\n";
    const needsTrailingBreak = nextChar && nextChar !== "\n";

    const insertText =
      (needsLeadingBreak ? "\n" : "") +
      textToInsert +
      (needsTrailingBreak ? "\n" : "");

    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: EditorSelection.cursor(from + insertText.length),
      scrollIntoView: true,
    });

    const nextValue = view.state.doc.toString();
    localValueRef.current = nextValue;
    setEditorValue(nextValue);
    setIsDirty(true);
    view.focus();
  }, []);

  const handleAddCommand = useCallback(
    (cmd: string) => {
      insertTextAtCursor(cmd);
    },
    [insertTextAtCursor],
  );

  const stats = useMemo(() => {
    const lines = editorValue.length ? editorValue.split("\n").length : 0;
    const chars = editorValue.length;
    return { lines, chars };
  }, [editorValue]);

  const filteredCommands = useMemo(() => {
    const q = commandSearch.trim().toLowerCase();
    if (!q) return COMMON_COMMANDS;
    return COMMON_COMMANDS.filter((cmd) => cmd.toLowerCase().includes(q));
  }, [commandSearch]);

  const isTab = variant === "tab";

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden border shadow-[var(--shadow)]"
      style={{
        borderRadius: isTab ? 20 : 24,
        background: "var(--color-panel-muted)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="flex flex-col gap-3 border-b px-4 pt-4 pb-3.5"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-panel)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
              <FiFileText size={18} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-[17px] font-bold text-[var(--color-text)]">
                  {title}
                </h3>

                {isDirty && (
                  <span
                    className="rounded-full border px-2 py-[2px] text-[11px] font-bold"
                    style={{
                      color: "var(--color-warning)",
                      background: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
                      borderColor: "var(--color-warning)",
                    }}
                  >
                    Есть изменения
                  </span>
                )}
              </div>

              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                {fileName} · {stats.lines} строк · {stats.chars} символов
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ui-btn-ghost"
                title="Закрыть редактор"
              >
                <FiX size={15} />
                <span>Закрыть</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleApply}
              className="ui-btn-primary"
              title="Применить изменения"
            >
              <FiCheck size={16} />
              <span>Применить</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="ui-btn-ghost"
              title="Сохранить как файл"
            >
              <FiDownload size={16} />
              <span>Сохранить</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="ui-btn-ghost"
              title="Вернуть исходный текст"
            >
              <FiRefreshCw size={16} />
              <span>Сбросить</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="ui-btn-danger"
              title="Очистить редактор"
            >
              <FiTrash2 size={16} />
              <span>Очистить</span>
            </button>
          </div>
        </div>

        <div
          className="sticky top-0 flex flex-col gap-2 rounded-2xl border p-3"
          style={{
            background: "var(--color-panel-solid)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <FiCommand size={16} />
            <span>Быстрые команды</span>
          </div>

          <div className="relative max-w-[280px]">
            <FiSearch
              size={15}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              placeholder="Найти команду..."
              className="ui-input pl-8"
            />
          </div>

          <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleAddCommand(cmd)}
                className="ui-btn-ghost"
                title={`Вставить ${cmd}`}
              >
                <FiEdit3 size={14} />
                <span>{cmd}</span>
              </button>
            ))}

            {filteredCommands.length === 0 && (
              <div className="text-[13px] text-[var(--color-text-muted)]">
                Команды не найдены
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-3 p-4">
        <div
          className="flex flex-wrap justify-between gap-2.5 rounded-xl border px-3 py-2 text-xs"
          style={{
            background: "var(--color-panel-solid)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <div className="flex flex-wrap gap-3.5">
            <span>⌘/Ctrl + S — сохранить</span>
            <span>Кнопки команд вставляют текст в курсор</span>
          </div>

          <div
            className="font-semibold"
            style={{
              color: isDirty ? "var(--color-warning)" : "var(--color-success)",
            }}
          >
            {isDirty ? "Не сохранено" : "Синхронизировано"}
          </div>
        </div>

        <div
          className="flex flex-1 min-h-0 overflow-hidden"
          style={{
            borderRadius: 18,
            border: `1px solid ${
              isDark ? "var(--color-border-strong)" : "#e2e8f0"
            }`,
            boxShadow: "inset 0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          <CodeMirror
            ref={editorRef}
            value={editorValue}
            height="100%"
            width="100%"
            extensions={extensions}
            basicSetup={{
              foldGutter: false,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: false,
              syntaxHighlighting: false,
              bracketMatching: false,
              closeBrackets: false,
              autocompletion: false,
              highlightActiveLine: true,
              highlightSelectionMatches: false,
              searchKeymap: true,
            }}
            onChange={handleChange}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}