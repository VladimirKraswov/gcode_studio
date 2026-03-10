import { FiSliders } from "react-icons/fi";
import { DocumentSettingsPanel } from "../modules/cad/panels/DocumentSettingsPanel";
import { ShapePropertiesPanel } from "../modules/cad/panels/ShapePropertiesPanel";
import type { SketchDocument } from "../modules/cad/model/types";
import type { SelectionState } from "../modules/cad/model/selection";
import type { CadPanButtonMode } from "../utils/settings";

type EditRightPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
  panButtonMode: CadPanButtonMode;
  onPanButtonModeChange: (value: CadPanButtonMode) => void;
};

export function EditRightPanel({
  document,
  setDocument,
  selection,
  panButtonMode,
  onPanButtonModeChange,
}: EditRightPanelProps) {
  const selectedShape =
    document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  return (
    <div
      className="ui-panel scrollbar-thin h-full min-h-0 overflow-y-auto overflow-x-hidden p-4"
    >
      <div className="mb-3.5 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
          <FiSliders size={18} />
        </div>

        <div>
          <div className="text-base font-extrabold text-[var(--color-text)]">
            Параметры документа
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Размер листа, подачи и режим резки
          </div>
        </div>
      </div>

      <DocumentSettingsPanel document={document} setDocument={setDocument} />

      {selectedShape && (
        <ShapePropertiesPanel
          document={document}
          setDocument={setDocument}
          selectedShape={selectedShape}
        />
      )}

      <div className="my-[18px] h-px bg-[var(--color-border)]" />

      <div className="grid gap-2.5">
        <div className="text-base font-extrabold text-[var(--color-text)]">
          Управление
        </div>

        <label className="ui-label">
          Кнопка панорамы
          <select
            value={panButtonMode}
            onChange={(e) => onPanButtonModeChange(e.target.value as CadPanButtonMode)}
            className="ui-input"
          >
            <option value="right">Правая кнопка</option>
            <option value="middle">Средняя кнопка</option>
            <option value="both">Правая и средняя</option>
          </select>
        </label>
      </div>
    </div>
  );
}