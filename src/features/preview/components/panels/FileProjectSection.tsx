import type { ChangeEvent } from "react";
import { FiBox, FiCamera, FiFolder, FiSave, FiUpload } from "react-icons/fi";
import { Button } from "@/shared/components/ui/Button";

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
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block">
          <Button variant="primary" className="w-full relative overflow-hidden">
            <FiUpload size={16} className="mr-2" />
            <span>Загрузить G-code</span>
            <input
              type="file"
              accept=".gcode,.nc,.tap,.txt"
              onChange={onFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </Button>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <Button variant="outline" className="w-full relative overflow-hidden">
              <FiFolder size={14} className="mr-2" />
              <span>Открыть</span>
              <input
                type="file"
                accept=".gs,application/json"
                onChange={onProjectFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
          </label>

          <Button variant="outline" onClick={onSaveProject} className="w-full">
            <FiSave size={14} className="mr-2" />
            Сохранить
          </Button>
        </div>
      </div>

      <div className="p-3 rounded-lg border border-border bg-panel-muted/50">
        <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Текущий файл</div>
        <div className="mt-1 text-[13px] font-bold text-text break-words">
          {fileName}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={onLoadDemo} className="w-full">
          <FiBox size={14} className="mr-2" />
          Демо
        </Button>
        <Button variant="ghost" onClick={onResetCamera} className="w-full">
          <FiCamera size={14} className="mr-2" />
          Камера
        </Button>
      </div>
    </div>
  );
}
