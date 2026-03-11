import type { ChangeEvent } from "react";
import { FiBox, FiCamera, FiFolder, FiSave, FiUpload } from "react-icons/fi";

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
      {/* Кнопка загрузки G‑code */}
      <label className="ui-btn-ghost w-full justify-center mb-3 relative overflow-hidden">
        <FiUpload size={16} />
        <span>Загрузить G-code</span>
        <input
          type="file"
          accept=".gcode,.nc,.tap,.txt"
          onChange={onFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>

      {/* Сетка для проектных файлов */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <label className="ui-btn-ghost w-full justify-center relative overflow-hidden">
          <FiFolder size={15} />
          <span>Открыть .gs</span>
          <input
            type="file"
            accept=".gs,application/json"
            onChange={onProjectFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

        <button type="button" onClick={onSaveProject} className="ui-btn-ghost w-full justify-center">
          <FiSave size={15} />
          Сохранить .gs
        </button>
      </div>

      {/* Информация о текущем файле */}
      <div className="ui-panel-inset p-3 mb-3">
        <div className="text-xs text-text-muted">Текущий файл</div>
        <div className="mt-1.5 font-extrabold text-text break-words">
          {fileName}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onLoadDemo} className="ui-btn-ghost w-full justify-center">
          <FiBox size={15} />
          Демо
        </button>
        <button type="button" onClick={onResetCamera} className="ui-btn-ghost w-full justify-center">
          <FiCamera size={15} />
          Камера
        </button>
      </div>
    </>
  );
}