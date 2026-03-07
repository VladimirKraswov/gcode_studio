import { GCodeEditor } from "./GCodeEditor";

type GCodeEditorTabProps = {
  source: string;
  setSource: (src: string) => void;
  fileName: string;
  onClose: () => void;
};

export function GCodeEditorTab({
  source,
  setSource,
  fileName,
  onClose,
}: GCodeEditorTabProps) {
  return (
    <GCodeEditor
      source={source}
      setSource={setSource}
      fileName={fileName}
      header={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>Редактор G-code</h3>
          <button type="button" onClick={onClose} style={{ padding: "4px 8px" }}>
            Закрыть
          </button>
        </div>
      }
    />
  );
}