import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <GCodeEditor
      source={source}
      setSource={setSource}
      fileName={fileName}
      variant="panel"
      title={t("tabs.gcode")}
    />
  );
}