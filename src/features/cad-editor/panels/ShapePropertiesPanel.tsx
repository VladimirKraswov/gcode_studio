import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBox,
  FiCircle,
  FiEdit3,
  FiImage,
  FiInfo,
  FiMinus,
  FiMove,
  FiRefreshCw,
  FiType,
  FiHash,
  FiTrash2,
} from "react-icons/fi";
import type {
  SketchBSpline,
  SketchDocument,
  SketchShape,
  SketchConstraint,
} from "../model/types";
import { updateShape } from "../model/document";
import { updateGeometry } from "../model/solver/manager";
import type { SelectionState } from "../model/selection";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import {
  getConstraintPointIds,
  getConstraintShapeIds,
  isDimensionalConstraint,
} from "../model/constraints";

export type ShapePropertiesPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
  onInsertBSplineControlPoint?: () => void;
  onRemoveBSplineControlPoint?: () => void;
  onDeleteConstraint?: (constraintId: string) => void;
};

const EDIT_ARRAY_GROUP_EVENT = "cad:edit-array-group";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-text-muted first:mt-0">
      {title}
    </div>
  );
}

function getShapeIcon(type: SketchShape["type"]) {
  switch (type) {
    case "rectangle":
      return <FiBox size={14} />;
    case "circle":
      return <FiCircle size={14} />;
    case "line":
      return <FiMinus size={14} />;
    case "arc":
      return <FiCircle size={14} />;
    case "polyline":
      return <FiMove size={14} />;
    case "bspline":
      return <FiRefreshCw size={14} />;
    case "text":
      return <FiType size={14} />;
    case "svg":
      return <FiImage size={14} />;
    default:
      return <FiEdit3 size={14} />;
  }
}

function useConstraintLabel() {
  const { t } = useTranslation();

  return (constraint: SketchConstraint): string => {
    const value =
      typeof constraint.value === "number"
        ? ` ${Number(constraint.value.toFixed(3))}`
        : "";

    switch (constraint.type) {
      case "horizontal": return t("cad.constraints.horizontal");
      case "vertical": return t("cad.constraints.vertical");
      case "coincident": return t("cad.constraints.coincident");
      case "parallel": return t("cad.constraints.parallel");
      case "perpendicular": return t("cad.constraints.perpendicular");
      case "equal": return t("cad.constraints.equal");
      case "tangent": return t("cad.constraints.tangent");
      case "distance": return `${t("cad.constraints.distance")}${value}`;
      case "distance-x": return `${t("cad.constraints.distance")} X${value}`;
      case "distance-y": return `${t("cad.constraints.distance")} Y${value}`;
      case "angle": return `Angle${value}`;
      case "radius": return `Radius${value}`;
      case "diameter": return `Diameter${value}`;
      case "point-on-object": return "Point on Object";
      case "midpoint": return "Midpoint";
      case "collinear": return "Collinear";
      case "lock": return t("cad.constraints.lock");
      default: return constraint.type;
    }
  };
}

function openArrayEditor(groupId: string) {
  window.dispatchEvent(
    new CustomEvent(EDIT_ARRAY_GROUP_EVENT, {
      detail: { groupId },
    }),
  );
}

export function ShapePropertiesPanel({
  document,
  setDocument,
  selection,
  onInsertBSplineControlPoint = () => {},
  onRemoveBSplineControlPoint = () => {},
  onDeleteConstraint = () => {},
}: ShapePropertiesPanelProps) {
  const { t } = useTranslation();
  const getConstraintLabel = useConstraintLabel();
  const selectedShape = useMemo(
    () =>
      selection.primaryRef?.kind === "shape"
        ? document.shapes.find((shape) => shape.id === selection.primaryRef?.id) ?? null
        : null,
    [document.shapes, selection.primaryRef],
  );

  const selectedPoint = useMemo(
    () =>
      selection.primaryRef?.kind === "point"
        ? document.points.find((point) => point.id === selection.primaryRef?.id) ?? null
        : null,
    [document.points, selection.primaryRef],
  );

  const selectedConstraint = useMemo(
    () =>
      selection.primaryRef?.kind === "constraint"
        ? document.constraints.find((constraint) => constraint.id === selection.primaryRef?.id) ?? null
        : null,
    [document.constraints, selection.primaryRef],
  );

  const selectedGroup = useMemo(
    () =>
      selectedShape?.groupId
        ? document.groups.find((group) => group.id === selectedShape.groupId) ?? null
        : null,
    [document.groups, selectedShape?.groupId],
  );

  const lineLength = useMemo(() => {
    if (selectedShape?.type !== "line") return null;
    const p1 = document.points.find((point) => point.id === (selectedShape as any).p1);
    const p2 = document.points.find((point) => point.id === (selectedShape as any).p2);
    if (!p1 || !p2) return 0;
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }, [selectedShape, document.points]);

  const selectedBSpline = selectedShape?.type === "bspline"
    ? (selectedShape as SketchBSpline)
    : null;

  if (!selectedShape && !selectedPoint && !selectedConstraint) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FiInfo size={32} className="text-border mb-3" />
        <div className="text-xs text-text-muted">
          {t("cad.properties.select_object")}
        </div>
      </div>
    );
  }

  if (selectedPoint) {
    return (
      <div className="flex flex-col gap-4 p-1">
        <div className="flex items-center gap-3 p-2 bg-panel-muted rounded-lg border border-border">
          <div className="w-8 h-8 rounded bg-primary-soft text-primary grid place-items-center">
            <FiMove size={14} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-text truncate">
              {t("cad.properties.point")} {selectedPoint.id}
            </div>
            <div className="text-[11px] text-text-muted capitalize">
              {t("cad.properties.vertex")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <SectionTitle title={t("cad.properties.geometry")} />
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>X</Label>
                <Input type="number" value={selectedPoint.x.toFixed(3)} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label>Y</Label>
                <Input type="number" value={selectedPoint.y.toFixed(3)} disabled />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="isFixed"
                checked={!!selectedPoint.isFixed}
                onChange={(e) => {
                  setDocument((prev) => ({
                    ...prev,
                    points: prev.points.map((point) =>
                      point.id === selectedPoint.id ? { ...point, isFixed: e.target.checked } : point,
                    ),
                  }));
                }}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="isFixed" className="mb-0 cursor-pointer">
                {t("cad.properties.lock")}
              </Label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedConstraint) {
    const pointIds = getConstraintPointIds(selectedConstraint);
    const shapeIds = getConstraintShapeIds(selectedConstraint);

    return (
      <div className="flex flex-col gap-4 p-1">
        <div className="flex items-center gap-3 p-2 bg-panel-muted rounded-lg border border-border">
          <div className="w-8 h-8 rounded bg-primary-soft text-primary grid place-items-center">
            <FiHash size={14} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-text truncate">
              {getConstraintLabel(selectedConstraint)}
            </div>
            <div className="text-[11px] text-text-muted capitalize">
              Constraint
            </div>
          </div>
        </div>

        <div>
          <SectionTitle title={t("cad.properties.parameters")} />
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>{t("cad.properties.type")}</Label>
              <Input value={selectedConstraint.type} disabled />
            </div>

            {isDimensionalConstraint(selectedConstraint) && (
              <div className="grid gap-1.5">
                <Label>{t("cad.properties.value")}</Label>
                <Input
                  type="number"
                  value={selectedConstraint.value ?? 0}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (!Number.isFinite(value)) return;

                    setDocument((prev) =>
                      updateGeometry({
                        ...prev,
                        constraints: prev.constraints.map((constraint) =>
                          constraint.id === selectedConstraint.id
                            ? { ...constraint, value }
                            : constraint,
                        ),
                      }),
                    );
                  }}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="constraint-enabled"
                checked={selectedConstraint.enabled}
                onChange={(e) => {
                  setDocument((prev) =>
                    updateGeometry({
                      ...prev,
                      constraints: prev.constraints.map((constraint) =>
                        constraint.id === selectedConstraint.id
                          ? { ...constraint, enabled: e.target.checked }
                          : constraint,
                      ),
                    }),
                  );
                }}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="constraint-enabled" className="mb-0 cursor-pointer">
                {t("cad.properties.constraint_active")}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="constraint-driven"
                checked={!!selectedConstraint.driven}
                onChange={(e) => {
                  setDocument((prev) =>
                    updateGeometry({
                      ...prev,
                      constraints: prev.constraints.map((constraint) =>
                        constraint.id === selectedConstraint.id
                          ? { ...constraint, driven: e.target.checked }
                          : constraint,
                      ),
                    }),
                  );
                }}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="constraint-driven" className="mb-0 cursor-pointer">
                {t("cad.properties.driven")}
              </Label>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle title={t("cad.properties.bindings")} />
          <div className="space-y-2">
            <div className="grid gap-1.5">
              <Label>{t("cad.properties.points")}</Label>
              <Input value={pointIds.join(", ")} disabled />
            </div>

            <div className="grid gap-1.5">
              <Label>{t("cad.properties.shapes")}</Label>
              <Input value={shapeIds.join(", ")} disabled />
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full border-danger text-danger"
          onClick={() => onDeleteConstraint(selectedConstraint.id)}
        >
          <FiTrash2 size={14} className="mr-2" />
          {t("cad.properties.delete_constraint")}
        </Button>
      </div>
    );
  }

  function updateSelected(patch: Record<string, any>) {
    if (!selectedShape) return;
    setDocument((prev) =>
      updateShape(prev, selectedShape.id, patch as Partial<SketchShape>),
    );
  }

  function updateSelectedBSpline(patch: Partial<SketchBSpline>) {
    if (!selectedBSpline) return;

    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) =>
        shape.id === selectedBSpline.id
          ? ({ ...shape, ...patch } as SketchShape)
          : shape,
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex items-center gap-3 p-2 bg-panel-muted rounded-lg border border-border">
        <div className="w-8 h-8 rounded bg-primary-soft text-primary grid place-items-center">
          {selectedShape ? getShapeIcon(selectedShape.type) : null}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-text truncate">
            {selectedShape?.name}
          </div>
          <div className="text-[11px] text-text-muted capitalize">
            {selectedShape?.type}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <SectionTitle title={t("cad.properties.identification")} />
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>{t("cad.properties.name")}</Label>
              <Input
                value={selectedShape?.name || ""}
                onChange={(e) => updateSelected({ name: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isConstruction"
                checked={!!selectedShape?.isConstruction}
                onChange={(e) => updateSelected({ isConstruction: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="isConstruction" className="mb-0 cursor-pointer">
                {t("cad.properties.construction")}
              </Label>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle title={t("cad.properties.geometry")} />

          {selectedShape?.type === "line" && (
            <div className="grid gap-1.5 mb-3">
              <Label>{t("cad.properties.length")}</Label>
              <Input
                type="number"
                value={lineLength?.toFixed(3)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value)) return;

                  setDocument((prev) => {
                    const existing = prev.constraints.find(
                      (constraint) =>
                        constraint.type === "distance" &&
                        getConstraintShapeIds(constraint).includes(selectedShape.id),
                    );

                    const nextConstraints = existing
                      ? prev.constraints.map((constraint) =>
                          constraint.id === existing.id
                            ? { ...constraint, value }
                            : constraint,
                        )
                      : prev.constraints;

                    return updateGeometry({
                      ...prev,
                      constraints: nextConstraints,
                    });
                  });
                }}
              />
            </div>
          )}

          {(selectedShape?.type === "circle" || selectedShape?.type === "arc") && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="grid gap-1.5">
                <Label>{t("cad.properties.radius")}</Label>
                <Input
                  type="number"
                  value={(selectedShape as any).radius?.toFixed(3)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value)) return;
                    updateSelected({ radius: value });
                    setDocument((prev) => updateGeometry(prev));
                  }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("cad.properties.diameter")}</Label>
                <Input
                  type="number"
                  value={((selectedShape as any).radius * 2)?.toFixed(3)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value)) return;
                    updateSelected({ radius: value / 2 });
                    setDocument((prev) => updateGeometry(prev));
                  }}
                />
              </div>
            </div>
          )}

          {selectedBSpline && (
            <div className="mb-3 space-y-3">
              <div className="p-3 bg-panel-muted border border-border rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>{t("cad.properties.degree")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max={Math.max(1, selectedBSpline.controlPointIds.length - 1)}
                      value={selectedBSpline.degree}
                      onChange={(e) => {
                        const maxDegree = Math.max(
                          1,
                          selectedBSpline.controlPointIds.length - 1,
                        );
                        const nextDegree = Math.max(
                          1,
                          Math.min(maxDegree, Number(e.target.value) || 1),
                        );
                        updateSelectedBSpline({ degree: nextDegree });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>{t("cad.properties.control_points")}</Label>
                    <Input
                      type="number"
                      value={selectedBSpline.controlPointIds.length}
                      disabled
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bspline-periodic"
                    checked={!!selectedBSpline.periodic}
                    onChange={(e) =>
                      updateSelectedBSpline({ periodic: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Label htmlFor="bspline-periodic" className="mb-0 cursor-pointer">
                    {t("cad.properties.periodic")}
                  </Label>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-panel-solid"
                    onClick={onInsertBSplineControlPoint}
                  >
                    {t("cad.properties.add_control_point")}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-panel-solid"
                    onClick={onRemoveBSplineControlPoint}
                    disabled={
                      !selection.primaryId ||
                      !selection.primaryId.startsWith("pt-") ||
                      !selectedBSpline.controlPointIds.includes(selection.primaryId)
                    }
                  >
                    {t("cad.properties.remove_control_point")}
                  </Button>
                </div>

                <div className="text-[11px] text-text-muted leading-relaxed">
                  {t("cad.properties.bspline_hint")}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("cad.properties.cut_z")}</Label>
              <Input
                type="number"
                value={selectedShape?.cutZ ?? document.cutZ}
                onChange={(e) =>
                  updateSelected({ cutZ: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div className="grid gap-1.5">
              <Label>{t("cad.properties.stroke_width")}</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={selectedShape?.strokeWidth ?? 1}
                onChange={(e) =>
                  updateSelected({
                    strokeWidth: Math.max(0.1, Number(e.target.value) || 0.1),
                  })
                }
              />
            </div>
          </div>
        </div>

        {selectedGroup?.array && (
          <div>
            <SectionTitle title={t("cad.properties.array")} />
            <div className="p-3 bg-primary-soft/30 border border-primary-soft rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-bold text-primary">
                <FiRefreshCw size={14} />
                {selectedGroup.array.type === "linear"
                  ? t("cad.properties.linear_array")
                  : t("cad.properties.circular_array")}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full bg-panel-solid"
                onClick={() => openArrayEditor(selectedGroup.id)}
              >
                <FiEdit3 size={14} className="mr-2" />
                {t("cad.properties.configure_array")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}