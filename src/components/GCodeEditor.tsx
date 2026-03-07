import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorSelection } from "@codemirror/state";
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { downloadTextFile } from "../utils";

type GCodeEditorProps = {
  source: string;
  setSource: (src: string) => void;
  fileName: string;
  header?: React.ReactNode;
};

const COMMON_COMMANDS = [
  "G0",
  "G1",
  "G90",
  "G91",
  "G21",
  "G20",
  "M3",
  "M5",
  "M6 T",
  "G04 P",
  "S",
  "F",
];

export function GCodeEditor({
  source,
  setSource,
  fileName,
  header,
}: GCodeEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const localValueRef = useRef(source);
  const [editorValue, setEditorValue] = useState(source);
  const [isDirty, setIsDirty] = useState(false);

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

  const extensions = useMemo(
    () => [
      lineNumbers(),
      highlightActiveLineGutter(),
      EditorView.lineWrapping,
      EditorView.editable.of(true),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "12px",
        },
        ".cm-scroller": {
          overflow: "auto",
          fontFamily: "monospace",
        },
        ".cm-content": {
          fontFamily: "monospace",
          whiteSpace: "pre",
        },
        ".cm-focused": {
          outline: "none",
        },
        ".cm-editor": {
          borderRadius: "8px",
        },
      }),
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
    ],
    [handleSave],
  );

  const handleChange = useCallback((value: string) => {
    localValueRef.current = value;
    setEditorValue(value);
    setIsDirty(true);
  }, []);

  const handleApply = useCallback(() => {
    setSource(localValueRef.current);
    setIsDirty(false);
  }, [setSource]);

  const handleAddCommand = useCallback((cmd: string) => {
    const view = editorRef.current?.view;
    if (!view) {
      return;
    }

    const selection = view.state.selection.main;
    const from = selection.from;
    const to = selection.to;
    const needsLeadingBreak =
      from > 0 && view.state.doc.sliceString(from - 1, from) !== "\n";

    const text = needsLeadingBreak ? `\n${cmd}` : cmd;

    view.dispatch({
      changes: { from, to, insert: text },
      selection: EditorSelection.cursor(from + text.length),
      scrollIntoView: true,
    });

    const nextValue = view.state.doc.toString();
    localValueRef.current = nextValue;
    setEditorValue(nextValue);
    setIsDirty(true);
    view.focus();
  }, []);

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {header}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Часто используемые команды
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {COMMON_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => handleAddCommand(cmd)}
              style={{ padding: "4px 8px", fontSize: 12 }}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <CodeMirror
          ref={editorRef}
          value={editorValue}
          height="100%"
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
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={handleApply} style={{ flex: 1 }}>
          Применить
        </button>
        <button type="button" onClick={handleSave} style={{ flex: 1 }}>
          Сохранить как...
        </button>
      </div>
    </div>
  );
}