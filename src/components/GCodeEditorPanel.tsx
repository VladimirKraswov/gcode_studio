import { GCodeEditor } from "./GCodeEditor";

type GCodeEditorPanelProps = {
  source: string;
  setSource: (src: string) => void;
  fileName: string;
};

export function GCodeEditorPanel({
  source,
  setSource,
  fileName,
}: GCodeEditorPanelProps) {
  return (
    <GCodeEditor
      source={source}
      setSource={setSource}
      fileName={fileName}
      header={<h3 style={{ marginTop: 0 }}>Редактор G-code</h3>}
    />
  );
}