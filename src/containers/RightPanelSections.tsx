import { FiEdit, FiSettings } from "react-icons/fi";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
<<<<<<< HEAD
import {
  ShapePropertiesPanel,
  DocumentSettingsPanel,
  calculateBSplineInsertionPoint,
} from "@/features/cad-editor";
=======
import { ShapePropertiesPanel, DocumentSettingsPanel, calculateBSplineInsertionPoint } from "@/features/cad-editor";
>>>>>>> 1e38d77 (Refactor CAD editor for type safety, performance, and modularity)
import type { SketchDocument, SelectionState } from "@/features/cad-editor";

interface CadPropertiesSectionProps {
  editDocument: SketchDocument;
<<<<<<< HEAD
  setEditDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
=======
  setEditDocument: (update: React.SetStateAction<SketchDocument>) => void;
>>>>>>> 1e38d77 (Refactor CAD editor for type safety, performance, and modularity)
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
<<<<<<< HEAD
          onDeleteConstraint={(constraintId) => {
            cadEditor?.deleteConstraintById?.(constraintId);
          }}
          onInsertBSplineControlPoint={() => {
            const primaryShapeId =
              selection.primaryRef?.kind === "shape"
                ? selection.primaryRef.id
                : selection.primaryId;

            const primaryShape = editDocument.shapes.find(
              (s) => s.id === primaryShapeId,
            );
            if (!primaryShape || primaryShape.type !== "bspline") return;

            const insertionPoint = calculateBSplineInsertionPoint(
              primaryShape,
              editDocument.points,
            );

            if (insertionPoint) {
              cadEditor?.insertControlPointToSelectedBSpline?.(
                insertionPoint.x,
                insertionPoint.y,
              );
            }
          }}
          onRemoveBSplineControlPoint={() => {
            cadEditor?.removeSelectedPointFromBSpline?.();
=======
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
>>>>>>> 1e38d77 (Refactor CAD editor for type safety, performance, and modularity)
          }}
        />
      </CollapsibleSection>
    </div>
  );
}

interface CamPropertiesSectionProps {
  editDocument: SketchDocument;
<<<<<<< HEAD
  setEditDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
=======
  setEditDocument: (update: React.SetStateAction<SketchDocument>) => void;
>>>>>>> 1e38d77 (Refactor CAD editor for type safety, performance, and modularity)
}

export function CamPropertiesSection({
  editDocument,
  setEditDocument,
}: CamPropertiesSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title="Настройки документа" icon={<FiSettings size={18} />}>
<<<<<<< HEAD
        <DocumentSettingsPanel
          document={editDocument}
          setDocument={setEditDocument}
        />
      </CollapsibleSection>
    </div>
  );
}
=======
        <DocumentSettingsPanel document={editDocument} setDocument={setEditDocument} />
      </CollapsibleSection>
    </div>
  );
}
>>>>>>> 1e38d77 (Refactor CAD editor for type safety, performance, and modularity)
