import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
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
  FiFileText,
  FiRefreshCw,
  FiTrash2,
  FiX,
  FiSave,
} from "react-icons/fi";
import { downloadTextFile } from "@/shared/utils/common";
import { useTheme } from "@/shared/hooks/useTheme";
import { lightEditorTheme, darkEditorTheme } from "@/styles/editorThemes";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { IconButton } from "@/shared/components/ui/IconButton";

type GCodeEditorProps = {
  source: string;
  setSource: (src: string) => void;
  fileName: string;
  variant?: "panel" | "tab";
  onClose?: () => void;
  title?: string;
};


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

const highlightStyle = HighlightStyle.define([
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
  onClose,
}: GCodeEditorProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
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

  const extensions = useMemo(() => {
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      EditorView.lineWrapping,
      EditorView.editable.of(true),
      gcodeLanguage,
      syntaxHighlighting(highlightStyle),
      isDark ? darkEditorTheme : lightEditorTheme,
      keymap.of([{
        key: "Mod-s",
        preventDefault: true,
        run: () => { handleSave(); return true; },
      }]),
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

  const stats = useMemo(() => {
    const lines = editorValue.length ? editorValue.split("\n").length : 0;
    const chars = editorValue.length;
    return { lines, chars };
  }, [editorValue]);

  return (
    <div className="flex flex-1 h-full min-h-0 min-w-0 flex-col bg-panel-solid overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FiFileText size={16} className="text-primary" />
            <h3 className="text-[13px] font-bold text-text truncate max-w-[200px]">{fileName}</h3>
            {isDirty && (
              <Badge variant="warning" className="px-1 py-0 h-4">{t("editor.modified")}</Badge>
            )}
          </div>
          <span className="text-[11px] text-text-muted font-mono">{stats.lines} {t("editor.lines")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="primary" size="sm" onClick={handleApply}>
            <FiCheck size={14} className="mr-1.5" /> {t("common.apply")}
          </Button>
          <IconButton icon={<FiSave size={14} />} onClick={handleSave} title={t("editor.export_file")} />
          <IconButton icon={<FiRefreshCw size={14} />} onClick={handleReset} title={t("editor.reset_original")} />
          <IconButton icon={<FiTrash2 size={14} />} variant="ghost" onClick={handleClear} title={t("editor.clear_all")} />
          {onClose && <IconButton icon={<FiX size={14} />} onClick={onClose} />}
        </div>
      </div>

      {/* Editor & Command Palette Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* Main Editor */}
        <div className="flex-1 min-h-0 flex flex-col bg-panel-solid relative">
          <div className="flex-1 min-h-0 overflow-hidden text-[13px]">
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

          {/* Footer inside editor */}
          <div className="h-6 flex items-center justify-between px-3 border-t border-border bg-panel-muted/20 text-[10px] text-text-muted">
             <div className="flex gap-4">
                <span>Ln 1, Col 1</span>
                <span>UTF-8</span>
                <span>G-code</span>
             </div>
             <div className={isDirty ? "text-warning font-bold" : "text-success font-bold"}>
                {isDirty ? t("editor.changed") : t("editor.saved")}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
