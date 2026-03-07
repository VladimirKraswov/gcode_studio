import { FiSliders } from "react-icons/fi";
import { DocumentSettingsPanel } from "../modules/cad/panels/DocumentSettingsPanel";
import { ShapePropertiesPanel } from "../modules/cad/panels/ShapePropertiesPanel";
import type { SketchDocument } from "../modules/cad/model/types";
import type { SelectionState } from "../modules/cad/model/selection";
import { theme, ui } from "../styles/ui";

type EditRightPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
};

export function EditRightPanel({
  document,
  setDocument,
  selection,
}: EditRightPanelProps) {
  const selectedShape =
    document.shapes.find((shape) => shape.id === selection.primaryId) ?? null;

  return (
    <div
      style={{
        ...ui.panel,
        padding: 16,
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
      className="scrollbar-thin"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={ui.iconBadge}>
          <FiSliders size={18} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>
            Параметры документа
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
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
    </div>
  );
}