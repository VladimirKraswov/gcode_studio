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
import { downloadTextFile } from "../utils";

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

// --- Язык G‑code ---
const gcodeLanguage = StreamLanguage.define({
  token: (stream: StringStream) => {
    if (stream.eatSpace()) return null;

    // Комментарии ;...
    if (stream.match(/^;.*/)) return "comment";

    // Номера строк N10, N100
    if (stream.match(/^[Nn]\d+/)) return "atom";

    // G/M/T/S/F/P/L команды
    if (stream.match(/^[GgMmTtSsFfPpLl]\d+(\.\d+)?/)) return "keyword";

    // Координаты и параметры
    if (stream.match(/^[XYZIJKABCUWV]\s*[+-]?\d*\.?\d+/)) return "variableName";

    // Просто числа
    if (stream.match(/^[+-]?\d*\.?\d+/)) return "number";

    stream.next();
    return null;
  },
});

// --- Стили для тегов (One Dark) ---
const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#7f8c8d", fontStyle: "italic" },
  { tag: tags.keyword, color: "#c678dd" }, // фиолетовый (G‑коды, M‑коды)
  { tag: tags.variableName, color: "#61afef" }, // синий (координаты)
  { tag: tags.number, color: "#d19a66" }, // оранжевый
  { tag: tags.atom, color: "#e5c07b" }, // жёлтый (номера строк)
]);

// --- Тема редактора (One Dark) ---
const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    width: "100%",
    fontSize: "13px",
    backgroundColor: "#282c34",
    color: "#abb2bf",
  },
  ".cm-editor": {
    height: "100%",
  },
  ".cm-scroller": {
    overflow: "auto !important",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    lineHeight: "1.6",
    padding: "8px 0",
  },
  ".cm-content": {
    padding: "14px 16px",
    whiteSpace: "pre",
    caretColor: "#61afef",
  },
  ".cm-line": {
    padding: "0 4px",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    backgroundColor: "#21252b",
    color: "#7f848e",
    borderRight: "1px solid #3e4451",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(97, 175, 239, 0.10)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(97, 175, 239, 0.16)",
    color: "#abb2bf",
  },
  ".cm-cursor": {
    borderLeftColor: "#61afef",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "rgba(80, 160, 210, 0.3)",
  },
});

export function GCodeEditor({
  source,
  setSource,
  fileName,
  variant = "panel",
  onClose,
  title = "Редактор G-code",
}: GCodeEditorProps) {
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
      editorTheme,
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
  }, [handleSave]);

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
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: isTab ? 20 : 24,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 10px 30px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* Шапка и панель команд */}
      <div
        style={{
          padding: "16px 16px 14px",
          borderBottom: "1px solid #e2e8f0",
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(10px)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconBadgeStyle}>
              <FiFileText size={18} />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {title}
                </h3>

                {isDirty && (
                  <span style={dirtyBadgeStyle}>Есть изменения</span>
                )}
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                {fileName} · {stats.lines} строк · {stats.chars} символов
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={toolbarGhostButtonStyle}
                title="Закрыть редактор"
              >
                <FiX size={15} />
                <span>Закрыть</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleApply}
              style={toolbarPrimaryButtonStyle}
              title="Применить изменения"
            >
              <FiCheck size={16} />
              <span>Применить</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={toolbarButtonStyle}
              title="Сохранить как файл"
            >
              <FiDownload size={16} />
              <span>Сохранить</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={toolbarButtonStyle}
              title="Вернуть исходный текст"
            >
              <FiRefreshCw size={16} />
              <span>Сбросить</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              style={toolbarDangerButtonStyle}
              title="Очистить редактор"
            >
              <FiTrash2 size={16} />
              <span>Очистить</span>
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 12,
            borderRadius: 16,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            <FiCommand size={16} />
            <span>Быстрые команды</span>
          </div>

          <div style={{ position: "relative", maxWidth: 280 }}>
            <FiSearch
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              placeholder="Найти команду..."
              style={searchInputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              maxHeight: 96,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {filteredCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleAddCommand(cmd)}
                style={commandButtonStyle}
                title={`Вставить ${cmd}`}
              >
                <FiEdit3 size={14} />
                <span>{cmd}</span>
              </button>
            ))}

            {filteredCommands.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Команды не найдены
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основная область с редактором */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>⌘/Ctrl + S — сохранить</span>
            <span>Кнопки команд вставляют текст в курсор</span>
          </div>

          <div style={{ fontWeight: 600, color: isDirty ? "#b45309" : "#16a34a" }}>
            {isDirty ? "Не сохранено" : "Синхронизировано"}
          </div>
        </div>

        {/* Контейнер CodeMirror */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid #1e293b",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            background: "#282c34",
            display: "flex",
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

// --- Стили для кнопок и значков ---
const iconBadgeStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "#dbeafe",
  color: "#2563eb",
  flexShrink: 0,
};

const dirtyBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#92400e",
  background: "#fef3c7",
  border: "1px solid #fde68a",
  padding: "2px 8px",
  borderRadius: 999,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "0 12px 0 32px",
  fontSize: 13,
  outline: "none",
  background: "#f8fafc",
};

const toolbarButtonStyle: React.CSSProperties = {
  height: 38,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const toolbarGhostButtonStyle: React.CSSProperties = {
  ...toolbarButtonStyle,
  background: "#f8fafc",
};

const toolbarPrimaryButtonStyle: React.CSSProperties = {
  ...toolbarButtonStyle,
  background: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)",
  color: "#ffffff",
  border: "1px solid #1d4ed8",
};

const toolbarDangerButtonStyle: React.CSSProperties = {
  ...toolbarButtonStyle,
  background: "#fff1f2",
  color: "#be123c",
  border: "1px solid #fecdd3",
};

const commandButtonStyle: React.CSSProperties = {
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};