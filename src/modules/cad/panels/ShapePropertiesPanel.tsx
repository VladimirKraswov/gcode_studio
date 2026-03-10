import { useEffect, useMemo, useState } from "react";
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
import { clamp } from "../../../utils";
import type {
  ConstraintEdge,
  SketchCamSettings,
  SketchDistanceConstraintTarget,
  SketchDocument,
  SketchShape,
} from "../model/types";
import { updateShape } from "../model/document";
import { DEFAULT_FONT_OPTIONS } from "../editor-state/textToolState";
import {
  addConstraint,
  getConstraintIssues,
  removeConstraint,
  updateConstraint,
} from "../model/constraints";

type ShapePropertiesPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selectedShape: SketchShape;
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
    <div className="min-w-0 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-panel-solid)] p-3">
      {title && (
        <div className="mb-2.5 text-[13px] font-extrabold text-[var(--color-text)]">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function getShapeIcon(type: SketchShape["type"]) {
  switch (type) {
    case "rectangle":
      return <FiBox size={18} />;
    case "circle":
      return <FiCircle size={18} />;
    case "line":
      return <FiMinus size={18} />;
    case "arc":
      return <FiCircle size={18} />;
    case "polyline":
      return <FiMove size={18} />;
    case "text":
      return <FiType size={18} />;
    case "svg":
      return <FiImage size={18} />;
    default:
      return <FiEdit3 size={18} />;
  }
}

function edgeTitle(edge: ConstraintEdge): string {
  switch (edge) {
    case "left":
      return "Левый";
    case "right":
      return "Правый";
    case "top":
      return "Верхний";
    case "bottom":
      return "Нижний";
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
  selectedShape,
}: ShapePropertiesPanelProps) {
  const otherShapes = useMemo(
    () => document.shapes.filter((shape) => shape.id !== selectedShape.id),
    [document.shapes, selectedShape.id],
  );

  const selectedGroup = useMemo(
    () =>
      selectedShape.groupId
        ? document.groups.find((group) => group.id === selectedShape.groupId) ?? null
        : null,
    [document.groups, selectedShape.groupId],
  );

  const shapeCamSettings = useMemo(
    () => resolveShapeCamSettings(selectedShape, document),
    [selectedShape, document],
  );

  const [newConstraintEdge, setNewConstraintEdge] = useState<ConstraintEdge>("left");
  const [newTargetKind, setNewTargetKind] = useState<SketchDistanceConstraintTarget["kind"]>(
    otherShapes.length > 0 ? "shape" : "sheet",
  );
  const [newTargetShapeId, setNewTargetShapeId] = useState<string>(
    otherShapes[0]?.id ?? "",
  );
  const [newTargetEdge, setNewTargetEdge] = useState<ConstraintEdge>("left");
  const [newDistance, setNewDistance] = useState<number>(0);

  useEffect(() => {
    setNewTargetKind(otherShapes.length > 0 ? "shape" : "sheet");
    setNewTargetShapeId(otherShapes[0]?.id ?? "");
  }, [selectedShape.id, otherShapes]);

  const selectedConstraints = useMemo(
    () =>
      document.constraints.filter(
        (constraint) => constraint.shapeId === selectedShape.id,
      ),
    [document.constraints, selectedShape.id],
  );

  const constraintIssues = useMemo(
    () => getConstraintIssues(document, selectedShape.id),
    [document, selectedShape.id],
  );

  function updateSelected(patch: Record<string, number | string | boolean | null>) {
    setDocument((prev) =>
      updateShape(prev, selectedShape.id, patch as Partial<SketchShape>),
    );
  }

  function updateSelectedCam(
    patch:
      | Partial<SketchCamSettings>
      | ((prev: SketchCamSettings) => SketchCamSettings),
  ) {
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

  function handleAddConstraint() {
    const target =
      newTargetKind === "sheet"
        ? ({ kind: "sheet" } as const)
        : ({
            kind: "shape",
            shapeId: newTargetShapeId,
          } as const);

    if (newTargetKind === "shape" && !newTargetShapeId) {
      return;
    }

    setDocument((prev) =>
      addConstraint(prev, {
        enabled: true,
        shapeId: selectedShape.id,
        edge: newConstraintEdge,
        target,
        targetEdge: newTargetEdge,
        distance: Number.isFinite(newDistance) ? newDistance : 0,
      }),
    );
  }

  return (
    <>
      <div className="my-[18px] h-px bg-[var(--color-border)]" />

      <div className="mb-3.5 flex items-center gap-3">
        <div className="ui-icon-badge">{getShapeIcon(selectedShape.type)}</div>
        <div>
          <div className="text-base font-extrabold text-[var(--color-text)]">
            Выбранный объект
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Тип: {selectedShape.type}
          </div>
        </div>
      </div>

      <div className="grid gap-3">
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

              {selectedGroup.array.type === "linear" ? (
                <div className="grid min-w-0 grid-cols-2 gap-2.5">
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Count</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.count}
                    </div>
                  </div>
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Spacing</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.spacing}
                    </div>
                  </div>
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Axis</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.axis.toUpperCase()}
                    </div>
                  </div>
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Direction</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.direction === "positive" ? "+" : "-"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid min-w-0 grid-cols-2 gap-2.5">
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Count</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.count}
                    </div>
                  </div>
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Total angle</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.totalAngle}
                    </div>
                  </div>
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Center X</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.centerX}
                    </div>
                  </div>
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Center Y</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.centerY}
                    </div>
                  </div>
                  <div className="ui-stat-card">
                    <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">Radius</div>
                    <div className="text-[15px] font-extrabold text-[var(--color-text)]">
                      {selectedGroup.array.params.radius}
                    </div>
                  </div>
                </div>
              )}

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
              Индивидуальная глубина Z
              <input
                className="ui-input"
                type="number"
                value={selectedShape.cutZ ?? document.cutZ}
                onChange={(e) => updateSelected({ cutZ: Number(e.target.value) || 0 })}
              />
            </label>

            <label className="ui-label">
              Толщина линии
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

        {selectedShape.type === "rectangle" && (
          <CardBlock>
            <div className="grid min-w-0 grid-cols-2 gap-2.5">
              <label className="ui-label">
                X
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.x}
                  onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                Y
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.y}
                  onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                Width
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.width}
                  onChange={(e) =>
                    updateSelected({
                      width: clamp(Number(e.target.value) || 1, 1, 100000),
                    })
                  }
                />
              </label>

              <label className="ui-label">
                Height
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.height}
                  onChange={(e) =>
                    updateSelected({
                      height: clamp(Number(e.target.value) || 1, 1, 100000),
                    })
                  }
                />
              </label>

              <label className="ui-label col-span-full">
                Угол поворота
                <input
                  className="ui-input"
                  type="number"
                  step="0.1"
                  value={selectedShape.rotation ?? 0}
                  onChange={(e) =>
                    updateSelected({
                      rotation: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
            </div>
          </CardBlock>
        )}

        {selectedShape.type === "circle" && (
          <CardBlock>
            <div className="grid min-w-0 grid-cols-2 gap-2.5">
              <label className="ui-label">
                CX
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.cx}
                  onChange={(e) => updateSelected({ cx: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                CY
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.cy}
                  onChange={(e) => updateSelected({ cy: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                Radius
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.radius}
                  onChange={(e) =>
                    updateSelected({
                      radius: clamp(Number(e.target.value) || 1, 1, 100000),
                    })
                  }
                />
              </label>
            </div>
          </CardBlock>
        )}

        {selectedShape.type === "line" && (
          <CardBlock>
            <div className="grid min-w-0 grid-cols-2 gap-2.5">
              <label className="ui-label">
                X1
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.x1}
                  onChange={(e) => updateSelected({ x1: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                Y1
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.y1}
                  onChange={(e) => updateSelected({ y1: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                X2
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.x2}
                  onChange={(e) => updateSelected({ x2: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                Y2
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.y2}
                  onChange={(e) => updateSelected({ y2: Number(e.target.value) || 0 })}
                />
              </label>
            </div>
          </CardBlock>
        )}

        {selectedShape.type === "arc" && (
          <CardBlock>
            <div className="grid min-w-0 grid-cols-2 gap-2.5">
              <label className="ui-label">
                CX
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.cx}
                  onChange={(e) => updateSelected({ cx: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                CY
                <input
                  className="ui-input"
                  type="number"
                  value={selectedShape.cy}
                  onChange={(e) => updateSelected({ cy: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="ui-label">
                Radius
                <input
                  className="ui-input"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={selectedShape.radius}
                  onChange={(e) =>
                    updateSelected({
                      radius: Math.max(0.001, Number(e.target.value) || 0.001),
                    })
                  }
                />
              </label>

              <label className="ui-label">
                Start angle
                <input
                  className="ui-input"
                  type="number"
                  step="0.1"
                  value={selectedShape.startAngle}
                  onChange={(e) =>
                    updateSelected({ startAngle: Number(e.target.value) || 0 })
                  }
                />
              </label>

              <label className="ui-label">
                End angle
                <input
                  className="ui-input"
                  type="number"
                  step="0.1"
                  value={selectedShape.endAngle}
                  onChange={(e) =>
                    updateSelected({ endAngle: Number(e.target.value) || 0 })
                  }
                />
              </label>
            </div>

            <label className="ui-check-row mt-2.5">
              <input
                type="checkbox"
                checked={selectedShape.clockwise}
                onChange={(e) => updateSelected({ clockwise: e.target.checked })}
              />
              <span>Clockwise</span>
            </label>
          </CardBlock>
        )}

        {selectedShape.type === "polyline" && (
          <label className="ui-check-row">
            <input
              type="checkbox"
              checked={selectedShape.closed}
              onChange={(e) => updateSelected({ closed: e.target.checked })}
            />
            <span>Замкнуть полилинию</span>
          </label>
        )}

        {selectedShape.type === "svg" && (
          <>
            <CardBlock>
              <div className="grid min-w-0 grid-cols-2 gap-2.5">
                <label className="ui-label">
                  X
                  <input
                    className="ui-input"
                    type="number"
                    value={selectedShape.x}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                  />
                </label>

                <label className="ui-label">
                  Y
                  <input
                    className="ui-input"
                    type="number"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                  />
                </label>

                <label className="ui-label">
                  Width
                  <input
                    className="ui-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={selectedShape.width}
                    onChange={(e) =>
                      updateSelected({
                        width: Math.max(0.001, Number(e.target.value) || 0.001),
                      })
                    }
                  />
                </label>

                <label className="ui-label">
                  Height
                  <input
                    className="ui-input"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={selectedShape.height}
                    onChange={(e) =>
                      updateSelected({
                        height: Math.max(0.001, Number(e.target.value) || 0.001),
                      })
                    }
                  />
                </label>

                <label className="ui-label col-span-full">
                  Угол поворота
                  <input
                    className="ui-input"
                    type="number"
                    step="0.1"
                    value={selectedShape.rotation ?? 0}
                    onChange={(e) =>
                      updateSelected({
                        rotation: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
              </div>
            </CardBlock>

            <label className="ui-check-row">
              <input
                type="checkbox"
                checked={selectedShape.preserveAspectRatio}
                onChange={(e) => updateSelected({ preserveAspectRatio: e.target.checked })}
              />
              <span>Пропорциональное масштабирование</span>
            </label>
          </>
        )}

        {selectedShape.type === "text" && (
          <>
            <CardBlock>
              <label className="ui-label">
                Текст
                <input
                  className="ui-input"
                  type="text"
                  value={selectedShape.text}
                  onChange={(e) => updateSelected({ text: e.target.value })}
                />
              </label>
            </CardBlock>

            <CardBlock>
              <div className="grid min-w-0 grid-cols-2 gap-2.5">
                <label className="ui-label">
                  X
                  <input
                    className="ui-input"
                    type="number"
                    value={selectedShape.x}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                  />
                </label>

                <label className="ui-label">
                  Y
                  <input
                    className="ui-input"
                    type="number"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                  />
                </label>

                <label className="ui-label">
                  Height
                  <input
                    className="ui-input"
                    type="number"
                    value={selectedShape.height}
                    onChange={(e) =>
                      updateSelected({
                        height: clamp(Number(e.target.value) || 2, 2, 100000),
                      })
                    }
                  />
                </label>

                <label className="ui-label">
                  Letter spacing
                  <input
                    className="ui-input"
                    type="number"
                    step="0.5"
                    value={selectedShape.letterSpacing}
                    onChange={(e) =>
                      updateSelected({
                        letterSpacing: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </label>
              </div>
            </CardBlock>

            <CardBlock>
              <div className="grid min-w-0 grid-cols-2 gap-2.5">
                <label className="ui-label">
                  Font
                  <select
                    value={selectedShape.fontFile}
                    onChange={(e) => updateSelected({ fontFile: e.target.value })}
                    className="ui-input"
                  >
                    {DEFAULT_FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>
                        {font.split("/").pop()}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ui-label">
                  Rotation
                  <input
                    className="ui-input"
                    type="number"
                    value={selectedShape.rotation ?? 0}
                    onChange={(e) => updateSelected({ rotation: Number(e.target.value) || 0 })}
                  />
                </label>

                <label className="ui-label col-span-full">
                  Align
                  <select
                    value={selectedShape.align ?? "left"}
                    onChange={(e) => updateSelected({ align: e.target.value })}
                    className="ui-input"
                  >
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                  </select>
                </label>
              </div>
            </CardBlock>
          </>
        )}

        <CardBlock title="CAM операция">
          <div className="grid gap-2.5">
            <div className="grid min-w-0 grid-cols-2 gap-2.5">
              <label className="ui-label">
                Operation
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
              </label>

              <label className="ui-label">
                Direction
                <select
                  value={shapeCamSettings.direction}
                  onChange={(e) =>
                    updateSelectedCam({
                      direction: e.target.value as SketchCamSettings["direction"],
                    })
                  }
                  className="ui-input"
                >
                  <option value="climb">Climb</option>
                  <option value="conventional">Conventional</option>
                </select>
              </label>

              <label className="ui-label">
                Stepdown override
                <input
                  className="ui-input"
                  type="number"
                  step="0.001"
                  value={shapeCamSettings.stepdown ?? ""}
                  onChange={(e) =>
                    updateSelectedCam({
                      stepdown:
                        e.target.value === ""
                          ? null
                          : Math.max(0.001, Number(e.target.value) || 0.001),
                    })
                  }
                  placeholder="inherit document"
                />
              </label>

              <label className="ui-label">
                Stepover override
                <input
                  className="ui-input"
                  type="number"
                  min="0.05"
                  max="1"
                  step="0.01"
                  value={shapeCamSettings.stepover ?? ""}
                  onChange={(e) =>
                    updateSelectedCam({
                      stepover:
                        e.target.value === ""
                          ? null
                          : Math.min(1, Math.max(0.05, Number(e.target.value) || 0.05)),
                    })
                  }
                  placeholder="inherit document"
                />
              </label>
            </div>

            <label className="ui-check-row">
              <input
                type="checkbox"
                checked={shapeCamSettings.ramping.enabled}
                onChange={(e) =>
                  updateSelectedCam((prev) => ({
                    ...prev,
                    ramping: {
                      ...prev.ramping,
                      enabled: e.target.checked,
                    },
                  }))
                }
              />
              <span>Enable ramping</span>
            </label>

            <label className="ui-label">
              Ramping turns
              <input
                className="ui-input"
                type="number"
                min="1"
                step="1"
                value={shapeCamSettings.ramping.turns}
                onChange={(e) =>
                  updateSelectedCam((prev) => ({
                    ...prev,
                    ramping: {
                      ...prev.ramping,
                      turns: Math.max(1, Number(e.target.value) || 1),
                    },
                  }))
                }
              />
            </label>

            <label className="ui-check-row">
              <input
                type="checkbox"
                checked={shapeCamSettings.tabs.enabled}
                onChange={(e) =>
                  updateSelectedCam((prev) => ({
                    ...prev,
                    tabs: {
                      ...prev.tabs,
                      enabled: e.target.checked,
                    },
                  }))
                }
              />
              <span>Enable tabs / bridges</span>
            </label>

            <div className="grid min-w-0 grid-cols-3 gap-2.5">
              <label className="ui-label">
                Tabs count
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  step="1"
                  value={shapeCamSettings.tabs.count}
                  onChange={(e) =>
                    updateSelectedCam((prev) => ({
                      ...prev,
                      tabs: {
                        ...prev.tabs,
                        count: Math.max(0, Number(e.target.value) || 0),
                      },
                    }))
                  }
                />
              </label>

              <label className="ui-label">
                Tabs width
                <input
                  className="ui-input"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={shapeCamSettings.tabs.width}
                  onChange={(e) =>
                    updateSelectedCam((prev) => ({
                      ...prev,
                      tabs: {
                        ...prev.tabs,
                        width: Math.max(0.1, Number(e.target.value) || 0.1),
                      },
                    }))
                  }
                />
              </label>

              <label className="ui-label">
                Tabs height
                <input
                  className="ui-input"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={shapeCamSettings.tabs.height}
                  onChange={(e) =>
                    updateSelectedCam((prev) => ({
                      ...prev,
                      tabs: {
                        ...prev.tabs,
                        height: Math.max(0.1, Number(e.target.value) || 0.1),
                      },
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </CardBlock>

        <CardBlock title="Расстояния / ограничения">
          <div className="grid gap-2.5">
            {selectedConstraints.length === 0 ? (
              <div className="ui-panel-inset p-3 text-[13px] text-[var(--color-text-muted)]">
                Для этого объекта ограничения ещё не заданы.
              </div>
            ) : (
              selectedConstraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className="grid gap-2 rounded-xl border p-2.5"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-panel-solid)",
                  }}
                >
                  <div className="grid min-w-0 grid-cols-2 gap-2.5">
                    <label className="ui-label">
                      Ребро объекта
                      <select
                        value={constraint.edge}
                        onChange={(e) =>
                          setDocument((prev) =>
                            updateConstraint(prev, constraint.id, {
                              edge: e.target.value as ConstraintEdge,
                            }),
                          )
                        }
                        className="ui-input"
                      >
                        <option value="left">Левый</option>
                        <option value="right">Правый</option>
                        <option value="top">Верхний</option>
                        <option value="bottom">Нижний</option>
                      </select>
                    </label>

                    <label className="ui-label">
                      До ребра
                      <select
                        value={constraint.targetEdge}
                        onChange={(e) =>
                          setDocument((prev) =>
                            updateConstraint(prev, constraint.id, {
                              targetEdge: e.target.value as ConstraintEdge,
                            }),
                          )
                        }
                        className="ui-input"
                      >
                        <option value="left">Левый</option>
                        <option value="right">Правый</option>
                        <option value="top">Верхний</option>
                        <option value="bottom">Нижний</option>
                      </select>
                    </label>

                    <label className="ui-label">
                      Цель
                      <select
                        value={constraint.target.kind}
                        onChange={(e) =>
                          setDocument((prev) =>
                            updateConstraint(prev, constraint.id, {
                              target:
                                e.target.value === "sheet"
                                  ? { kind: "sheet" }
                                  : {
                                      kind: "shape",
                                      shapeId:
                                        otherShapes[0]?.id ??
                                        (constraint.target.kind === "shape"
                                          ? constraint.target.shapeId
                                          : ""),
                                    },
                            }),
                          )
                        }
                        className="ui-input"
                      >
                        <option value="sheet">Лист</option>
                        <option value="shape">Объект</option>
                      </select>
                    </label>

                    <label className="ui-label">
                      Расстояние
                      <input
                        className="ui-input"
                        type="number"
                        step="0.001"
                        value={constraint.distance}
                        onChange={(e) =>
                          setDocument((prev) =>
                            updateConstraint(prev, constraint.id, {
                              distance: Number(e.target.value) || 0,
                            }),
                          )
                        }
                      />
                    </label>
                  </div>

                  {constraint.target.kind === "shape" && (
                    <label className="ui-label">
                      Целевой объект
                      <select
                        value={constraint.target.shapeId}
                        onChange={(e) =>
                          setDocument((prev) =>
                            updateConstraint(prev, constraint.id, {
                              target: {
                                kind: "shape",
                                shapeId: e.target.value,
                              },
                            }),
                          )
                        }
                        className="ui-input"
                      >
                        {otherShapes.map((shape) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <label className="ui-check-row">
                      <input
                        type="checkbox"
                        checked={constraint.enabled}
                        onChange={(e) =>
                          setDocument((prev) =>
                            updateConstraint(prev, constraint.id, {
                              enabled: e.target.checked,
                            }),
                          )
                        }
                      />
                      <span>Включено</span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setDocument((prev) => removeConstraint(prev, constraint.id))
                      }
                      className="ui-btn-danger"
                    >
                      Удалить
                    </button>
                  </div>

                  <div className="text-xs text-[var(--color-text-muted)]">
                    {edgeTitle(constraint.edge)} край объекта →{" "}
                    {constraint.target.kind === "sheet"
                      ? "граница листа"
                      : otherShapes.find((shape) => shape.id === (constraint.target.kind === "shape" ? constraint.target.shapeId : ""))
                          ?.name ?? "объект"}{" "}
                    / {edgeTitle(constraint.targetEdge).toLowerCase()} край
                  </div>
                </div>
              ))
            )}

            <div className="my-[2px] h-px bg-[var(--color-border)]" />

            <div className="text-[13px] font-extrabold text-[var(--color-text)]">
              Добавить ограничение
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2.5">
              <label className="ui-label">
                Ребро объекта
                <select
                  value={newConstraintEdge}
                  onChange={(e) => setNewConstraintEdge(e.target.value as ConstraintEdge)}
                  className="ui-input"
                >
                  <option value="left">Левый</option>
                  <option value="right">Правый</option>
                  <option value="top">Верхний</option>
                  <option value="bottom">Нижний</option>
                </select>
              </label>

              <label className="ui-label">
                До ребра
                <select
                  value={newTargetEdge}
                  onChange={(e) => setNewTargetEdge(e.target.value as ConstraintEdge)}
                  className="ui-input"
                >
                  <option value="left">Левый</option>
                  <option value="right">Правый</option>
                  <option value="top">Верхний</option>
                  <option value="bottom">Нижний</option>
                </select>
              </label>

              <label className="ui-label">
                Цель
                <select
                  value={newTargetKind}
                  onChange={(e) =>
                    setNewTargetKind(
                      e.target.value as SketchDistanceConstraintTarget["kind"],
                    )
                  }
                  className="ui-input"
                >
                  <option value="sheet">Лист</option>
                  <option value="shape">Объект</option>
                </select>
              </label>

              <label className="ui-label">
                Расстояние
                <input
                  className="ui-input"
                  type="number"
                  step="0.001"
                  value={newDistance}
                  onChange={(e) => setNewDistance(Number(e.target.value) || 0)}
                />
              </label>
            </div>

            {newTargetKind === "shape" && (
              <label className="ui-label">
                Целевой объект
                <select
                  value={newTargetShapeId}
                  onChange={(e) => setNewTargetShapeId(e.target.value)}
                  className="ui-input"
                >
                  {otherShapes.map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {shape.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button type="button" onClick={handleAddConstraint} className="ui-btn-primary">
              Добавить расстояние
            </button>

            {constraintIssues.length > 0 && (
              <div
                className="grid gap-2 rounded-xl border p-3 text-[13px]"
                style={{
                  borderColor: "var(--color-danger)",
                  background: "var(--color-danger-soft)",
                  color: "var(--color-danger)",
                }}
              >
                <div className="font-extrabold">Предупреждения по ограничениям</div>

                {constraintIssues.map((issue, index) => (
                  <div key={`${issue.constraintId}-${index}`}>• {issue.message}</div>
                ))}
              </div>
            )}
          </div>
        </CardBlock>
      </div>
    </>
  );
}