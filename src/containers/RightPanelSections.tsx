import { FiEdit, FiSettings } from "react-icons/fi";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { ShapePropertiesPanel, DocumentSettingsPanel, calculateBSplineInsertionPoint } from "@/features/cad-editor";
import type { SketchDocument, SelectionState } from "@/features/cad-editor";

interface CadPropertiesSectionProps {
  editDocument: SketchDocument;
  setEditDocument: (update: React.SetStateAction<SketchDocument>) => void;
  selection: SelectionState;
  cadEditor: any;
}

export function CadPropertiesSection({
  editDocument,
  setEditDocument,
  selection,
  cadEditor,
}: CadPropertiesSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title="Свойства объекта" icon={<FiEdit size={18} />}>
        <ShapePropertiesPanel
          document={editDocument}
          setDocument={setEditDocument}
          selection={selection}
          onInsertBSplineControlPoint={() => {
            const primaryShape = editDocument.shapes.find((s) => s.id === selection.primaryId);
            if (!primaryShape || primaryShape.type !== "bspline") return;

            const insertionPoint = calculateBSplineInsertionPoint(primaryShape, editDocument.points);
            if (insertionPoint) {
              cadEditor?.insertControlPointToSelectedBSpline(insertionPoint.x, insertionPoint.y);
            }
          }}
          onRemoveBSplineControlPoint={() => {
            cadEditor?.removeSelectedPointFromBSpline();
          }}
        />
      </CollapsibleSection>
    </div>
  );
}

interface CamPropertiesSectionProps {
  editDocument: SketchDocument;
  setEditDocument: (update: React.SetStateAction<SketchDocument>) => void;
}

export function CamPropertiesSection({
  editDocument,
  setEditDocument,
}: CamPropertiesSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title="Настройки документа" icon={<FiSettings size={18} />}>
        <DocumentSettingsPanel document={editDocument} setDocument={setEditDocument} />
      </CollapsibleSection>
    </div>
  );
}
