import { GCodeEditor } from "./GCodeEditor";

type GCodeEditorPanelProps = {
  source: string;
  setSource: (src: string) => void;
  fileName: string;
};

export default function GCodeEditorPanel({
  source,
  setSource,
  fileName,
}: GCodeEditorPanelProps) {
  return (
    <GCodeEditor
      source={source}
      setSource={setSource}
      fileName={fileName}
      variant="panel"
      title="Редактор G-code"
    />
  );
}