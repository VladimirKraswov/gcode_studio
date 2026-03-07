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
      variant="tab"
      title="Редактор G-code"
      onClose={onClose}
    />
  );
}