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
} from "react-icons/fi";
import { createDefaultCamSettings } from "../model/document";
import type {
  SketchCamSettings,
  SketchDocument,
  SketchShape,
} from "../model/types";
import { updateShape } from "../model/document";
import type { SelectionState } from "../model/selection";

export type ShapePropertiesPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
};

const EDIT_ARRAY_GROUP_EVENT = "cad:edit-array-group";

function CardBlock({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-border bg-panel-solid p-3">
      {title && (
        <div className="mb-2.5 text-[13px] font-extrabold text-text">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function getShapeIcon(type: SketchShape["type"]) {
  switch (type) {
    case "rectangle": return <FiBox size={18} />;
    case "circle": return <FiCircle size={18} />;
    case "line": return <FiMinus size={18} />;
    case "arc": return <FiCircle size={18} />;
    case "polyline": return <FiMove size={18} />;
    case "text": return <FiType size={18} />;
    case "svg": return <FiImage size={18} />;
    default: return <FiEdit3 size={18} />;
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
    return <div className="p-4 text-xs text-text-muted">Выберите объект, чтобы увидеть его свойства.</div>;
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
    <div className="grid gap-3">
      <div className="mb-1 flex items-center gap-3">
        <div className="ui-icon-badge">{getShapeIcon(selectedShape.type)}</div>
        <div>
          <div className="text-base font-extrabold text-text">
            {selectedShape.name}
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            Тип: {selectedShape.type}
          </div>
        </div>
      </div>

      {selectedGroup?.array && (
        <CardBlock title="Параметры массива">
          <div className="grid gap-2.5">
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-extrabold"
              style={{
                border:
                  selectedGroup.array.type === "linear"
                    ? "1px solid #a5f3fc"
                    : "1px solid #c4b5fd",
                background:
                  selectedGroup.array.type === "linear" ? "#ecfeff" : "#f5f3ff",
                color:
                  selectedGroup.array.type === "linear" ? "#155e75" : "#5b21b6",
              }}
            >
              <FiRefreshCw size={12} />
              {selectedGroup.array.type === "linear"
                ? "Linear array"
                : "Circular array"}
            </div>

            <button
              type="button"
              onClick={() => openArrayEditor(selectedGroup.id)}
              className="ui-btn-primary"
            >
              <FiEdit3 size={15} />
              Редактировать
            </button>
          </div>
        </CardBlock>
      )}

      <CardBlock>
        <label className="ui-label">
          Имя
          <input
            className="ui-input"
            type="text"
            value={selectedShape.name}
            onChange={(e) => updateSelected({ name: e.target.value })}
          />
        </label>
      </CardBlock>

      <CardBlock>
        <div className="grid min-w-0 grid-cols-2 gap-2.5">
          <label className="ui-label">
            Глубина Z
            <input
              className="ui-input"
              type="number"
              value={selectedShape.cutZ ?? document.cutZ}
              onChange={(e) => updateSelected({ cutZ: Number(e.target.value) || 0 })}
            />
          </label>

          <label className="ui-label">
            Толщина
            <input
              className="ui-input"
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
          </label>
        </div>
      </CardBlock>

      <CardBlock title="CAM операция">
        {shapeCamSettings && (
          <div className="grid gap-2.5">
            <select
              value={shapeCamSettings.operation}
              onChange={(e) =>
                updateSelectedCam({
                  operation: e.target.value as SketchCamSettings["operation"],
                })
              }
              className="ui-input"
            >
              <option value="follow-path">Follow path</option>
              <option value="profile-inside">Profile inside</option>
              <option value="profile-outside">Profile outside</option>
              <option value="pocket">Pocket</option>
            </select>
          </div>
        )}
      </CardBlock>
    </div>
  );
}
