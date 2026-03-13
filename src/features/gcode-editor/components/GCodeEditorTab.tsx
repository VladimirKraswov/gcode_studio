import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <GCodeEditor
      source={source}
      setSource={setSource}
      fileName={fileName}
      variant="tab"
      title={t("tabs.gcode")}
      onClose={onClose}
    />
  );
}