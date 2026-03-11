// src/features/cad-editor/panels/settings/ToolSection.tsx
import type { SketchDocument } from "@/features/cad-editor/model/types";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";

type ToolSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function ToolSection({ document, setDocument }: ToolSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label>Тип инструмента</Label>
        <select
          value={document.toolType}
          onChange={(e) =>
            setDocument((prev) => ({
              ...prev,
              toolType: e.target.value as SketchDocument["toolType"],
              spindleOn: e.target.value === "laser" ? true : prev.spindleOn,
            }))
          }
          className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="router">Router (Фреза)</option>
          <option value="spindle">Spindle (Шпиндель)</option>
          <option value="laser">Laser (Лазер)</option>
          <option value="drag-knife">Drag knife (Флюгерный нож)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Номер T</Label>
          <Input
            type="number"
            min="1"
            value={document.toolNumber}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                toolNumber: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Диаметр (мм)</Label>
          <Input
            type="number"
            min="0"
            step="0.001"
            value={document.toolDiameter}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                toolDiameter: Math.max(0.001, Number(e.target.value) || 0.001),
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Шаг перекрытия (Stepover 0..1)</Label>
        <Input
          type="number"
          min="0.05"
          max="1"
          step="0.01"
          value={document.stepover}
          onChange={(e) =>
            setDocument((prev) => ({
              ...prev,
              stepover: Math.min(1, Math.max(0.05, Number(e.target.value) || 0.45)),
            }))
          }
        />
      </div>
    </div>
  );
}
