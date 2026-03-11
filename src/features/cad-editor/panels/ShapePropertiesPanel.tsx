import { useMemo } from "react";
import {
  FiBox,
  FiCircle,
  FiEdit3,
  FiImage,
  FiMinus,
  FiMove,
  FiRefreshCw,
  FiType,
  FiInfo,
  FiCrosshair,
} from "react-icons/fi";
import { createDefaultCamSettings } from "../model/document";
import type {
  SketchCamSettings,
  SketchDocument,
  SketchShape,
} from "../model/types";
import { updateShape } from "../model/document";
import type { SelectionState } from "../model/selection";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

export type ShapePropertiesPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
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
    case "rectangle": return <FiBox size={14} />;
    case "circle": return <FiCircle size={14} />;
    case "line": return <FiMinus size={14} />;
    case "arc": return <FiCircle size={14} />;
    case "polyline": return <FiMove size={14} />;
    case "text": return <FiType size={14} />;
    case "svg": return <FiImage size={14} />;
    default: return <FiEdit3 size={14} />;
  }
}

function openArrayEditor(groupId: string) {
  window.dispatchEvent(
    new CustomEvent(EDIT_ARRAY_GROUP_EVENT, {
      detail: { groupId },
    }),
  );
}

function resolveShapeCamSettings(
  shape: SketchShape,
  document: SketchDocument,
): SketchCamSettings {
  const docDefaults = document.defaultCamSettings ?? createDefaultCamSettings();
  const shapeCam = shape.camSettings ?? {};

  return {
    operation: shapeCam.operation ?? docDefaults.operation,
    direction: shapeCam.direction ?? docDefaults.direction,
    stepdown: shapeCam.stepdown ?? docDefaults.stepdown,
    stepover: shapeCam.stepover ?? docDefaults.stepover,
    tabs: {
      enabled: shapeCam.tabs?.enabled ?? docDefaults.tabs.enabled,
      count: shapeCam.tabs?.count ?? docDefaults.tabs.count,
      width: shapeCam.tabs?.width ?? docDefaults.tabs.width,
      height: shapeCam.tabs?.height ?? docDefaults.tabs.height,
    },
    ramping: {
      enabled: shapeCam.ramping?.enabled ?? docDefaults.ramping.enabled,
      turns: shapeCam.ramping?.turns ?? docDefaults.ramping.turns,
    },
  };
}

export function ShapePropertiesPanel({
  document,
  setDocument,
  selection,
}: ShapePropertiesPanelProps) {
  const selectedShape = useMemo(
    () => document.shapes.find(s => s.id === selection.primaryId) ?? null,
    [document.shapes, selection.primaryId]
  );

  const selectedGroup = useMemo(
    () =>
      selectedShape?.groupId
        ? document.groups.find((group) => group.id === selectedShape.groupId) ?? null
        : null,
    [document.groups, selectedShape?.groupId],
  );

  const shapeCamSettings = useMemo(
    () => selectedShape ? resolveShapeCamSettings(selectedShape, document) : null,
    [selectedShape, document],
  );

  if (!selectedShape) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FiInfo size={32} className="text-border mb-3" />
        <div className="text-xs text-text-muted">Выберите объект на холсте для просмотра свойств</div>
      </div>
    );
  }

  function updateSelected(patch: Record<string, any>) {
    if (!selectedShape) return;
    setDocument((prev) =>
      updateShape(prev, selectedShape.id, patch as Partial<SketchShape>),
    );
  }

  function updateSelectedCam(
    patch:
      | Partial<SketchCamSettings>
      | ((prev: SketchCamSettings) => SketchCamSettings),
  ) {
    if (!selectedShape) return;
    const current = resolveShapeCamSettings(selectedShape, document);
    const next =
      typeof patch === "function"
        ? patch(current)
        : { ...current, ...patch };

    setDocument((prev) =>
      updateShape(prev, selectedShape.id, {
        camSettings: next,
      } as Partial<SketchShape>),
    );
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex items-center gap-3 p-2 bg-panel-muted rounded-lg border border-border">
        <div className="w-8 h-8 rounded bg-primary-soft text-primary grid place-items-center">
          {getShapeIcon(selectedShape.type)}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-text truncate">
            {selectedShape.name}
          </div>
          <div className="text-[11px] text-text-muted capitalize">
            {selectedShape.type}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <SectionTitle title="Идентификация" />
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Имя объекта</Label>
              <Input
                value={selectedShape.name}
                onChange={(e) => updateSelected({ name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <SectionTitle title="Геометрия" />
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Глубина Z</Label>
              <Input
                type="number"
                value={selectedShape.cutZ ?? document.cutZ}
                onChange={(e) => updateSelected({ cutZ: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Толщина линии</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={selectedShape.strokeWidth ?? 1}
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
            <SectionTitle title="Массив" />
            <div className="p-3 bg-primary-soft/30 border border-primary-soft rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-[12px] font-bold text-primary">
                <FiRefreshCw size={14} />
                {selectedGroup.array.type === "linear"
                  ? "Линейный массив"
                  : "Круговой массив"}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-panel-solid"
                onClick={() => openArrayEditor(selectedGroup.id)}
              >
                <FiEdit3 size={14} className="mr-2" />
                Настроить массив
              </Button>
            </div>
          </div>
        )}

        <div>
          <SectionTitle title="CAM Обработка" />
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Тип операции</Label>
              <select
                value={shapeCamSettings?.operation}
                onChange={(e) =>
                  updateSelectedCam({
                    operation: e.target.value as SketchCamSettings["operation"],
                  })
                }
                className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="follow-path">По контуру (Follow path)</option>
                <option value="profile-inside">Внутри (Inside)</option>
                <option value="profile-outside">Снаружи (Outside)</option>
                <option value="pocket">Карман (Pocket)</option>
              </select>
            </div>

            {shapeCamSettings?.operation !== "follow-path" && (
              <div className="grid gap-1.5">
                <Label>Направление</Label>
                <select
                  value={shapeCamSettings?.direction}
                  onChange={(e) =>
                    updateSelectedCam({
                      direction: e.target.value as SketchCamSettings["direction"],
                    })
                  }
                  className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="climb">Попутное (Climb)</option>
                  <option value="conventional">Встречное (Conventional)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
