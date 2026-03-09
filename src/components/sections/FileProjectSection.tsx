import type { ChangeEvent } from "react";
import { FiBox, FiCamera, FiFolder, FiSave, FiUpload } from "react-icons/fi";
import { theme, ui } from "../../styles/ui";

type FileProjectSectionProps = {
  fileName: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProjectFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveProject: () => void;
  onLoadDemo: () => void;
  onResetCamera: () => void;
};

export function FileProjectSection({
  fileName,
  onFileChange,
  onProjectFileChange,
  onSaveProject,
  onLoadDemo,
  onResetCamera,
}: FileProjectSectionProps) {
  return (
    <>
      <label
        style={{
          ...ui.buttonGhost,
          width: "100%",
          justifyContent: "center",
          marginBottom: 12,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <FiUpload size={16} />
        <span>Загрузить G-code</span>
        <input
          type="file"
          accept=".gcode,.nc,.tap,.txt"
          onChange={onFileChange}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <label
          style={{
            ...ui.buttonGhost,
            width: "100%",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <FiFolder size={15} />
          <span>Открыть .gs</span>
          <input
            type="file"
            accept=".gs,application/json"
            onChange={onProjectFileChange}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </label>

        <button type="button" onClick={onSaveProject} style={ui.buttonGhost}>
          <FiSave size={15} />
          Сохранить .gs
        </button>
      </div>

      <div
        style={{
          ...ui.panelInset,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div style={ui.mutedText}>Текущий файл</div>
        <div
          style={{
            marginTop: 6,
            fontWeight: 800,
            color: theme.text,
            wordBreak: "break-word",
          }}
        >
          {fileName}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button type="button" onClick={onLoadDemo} style={ui.buttonGhost}>
          <FiBox size={15} />
          Демо
        </button>
        <button type="button" onClick={onResetCamera} style={ui.buttonGhost}>
          <FiCamera size={15} />
          Камера
        </button>
      </div>
    </>
  );
}