import { FiEdit, FiSettings } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import {
  ShapePropertiesPanel,
  DocumentSettingsPanel,
  calculateBSplineInsertionPoint,
} from "@/features/cad-editor";
import type { SketchDocument, SelectionState } from "@/features/cad-editor";

interface CadPropertiesSectionProps {
  editDocument: SketchDocument;
  setEditDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
  cadEditor: any;
}

export function CadPropertiesSection({
  editDocument,
  setEditDocument,
  selection,
  cadEditor,
}: CadPropertiesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title={t("common.object_properties")} icon={<FiEdit size={18} />}>
        <ShapePropertiesPanel
          document={editDocument}
          setDocument={setEditDocument}
          selection={selection}
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
          }}
        />
      </CollapsibleSection>
    </div>
  );
}

interface CamPropertiesSectionProps {
  editDocument: SketchDocument;
  setEditDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
}

export function CamPropertiesSection({
  editDocument,
  setEditDocument,
}: CamPropertiesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title={t("common.doc_settings")} icon={<FiSettings size={18} />}>
        <DocumentSettingsPanel
          document={editDocument}
          setDocument={setEditDocument}
        />
      </CollapsibleSection>
    </div>
  );
}