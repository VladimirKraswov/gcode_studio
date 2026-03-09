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
import { useStyles } from "../../../styles/useStyles";
import { useTheme } from "../../../contexts/ThemeContext";
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
  const { theme } = useTheme();
  return (
    <div
      style={{
        background: theme.panelSolid,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: 12,
        minWidth: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: theme.text,
            marginBottom: 10,
          }}
        >
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
  const styles = useStyles();
  const { theme } = useTheme();

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

  const twoColumnGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    minWidth: 0,
  };

  const threeColumnGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    minWidth: 0,
  };

  const checkboxRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 700,
    color: theme.text,
    padding: 12,
    borderRadius: 12,
    background: theme.panelSolid,
    border: `1px solid ${theme.border}`,
  };

  return (
    <>
      <div style={{ height: 1, background: theme.border, margin: "18px 0" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={styles.iconBadge}>{getShapeIcon(selectedShape.type)}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>
            Выбранный объект
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
            Тип: {selectedShape.type}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {selectedGroup?.array && (
          <CardBlock title="Параметры массива">
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  width: "fit-content",
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
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
                <div style={twoColumnGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Count</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.count}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Spacing</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.spacing}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Axis</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.axis.toUpperCase()}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Direction</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.direction === "positive" ? "+" : "-"}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={twoColumnGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Count</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.count}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Total angle</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.totalAngle}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Center X</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.centerX}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Center Y</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.centerY}
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Radius</div>
                    <div style={{ ...styles.statValue, fontSize: 15 }}>
                      {selectedGroup.array.params.radius}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => openArrayEditor(selectedGroup.id)}
                style={styles.buttonPrimary}
              >
                <FiEdit3 size={15} />
                Редактировать
              </button>
            </div>
          </CardBlock>
        )}

        <CardBlock>
          <label style={styles.inputLabel}>
            Имя
            <input
              style={styles.input}
              type="text"
              value={selectedShape.name}
              onChange={(e) => updateSelected({ name: e.target.value })}
            />
          </label>
        </CardBlock>

        <CardBlock>
          <div style={twoColumnGrid}>
            <label style={styles.inputLabel}>
              Индивидуальная глубина Z
              <input
                style={styles.input}
                type="number"
                value={selectedShape.cutZ ?? document.cutZ}
                onChange={(e) => updateSelected({ cutZ: Number(e.target.value) || 0 })}
              />
            </label>

            <label style={styles.inputLabel}>
              Толщина линии
              <input
                style={styles.input}
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
            <div style={twoColumnGrid}>
              <label style={styles.inputLabel}>
                X
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.x}
                  onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                Y
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.y}
                  onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                Width
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.width}
                  onChange={(e) =>
                    updateSelected({
                      width: clamp(Number(e.target.value) || 1, 1, 100000),
                    })
                  }
                />
              </label>

              <label style={styles.inputLabel}>
                Height
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.height}
                  onChange={(e) =>
                    updateSelected({
                      height: clamp(Number(e.target.value) || 1, 1, 100000),
                    })
                  }
                />
              </label>

              <label style={{ ...styles.inputLabel, gridColumn: "1 / -1" }}>
                Угол поворота
                <input
                  style={styles.input}
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
            <div style={twoColumnGrid}>
              <label style={styles.inputLabel}>
                CX
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.cx}
                  onChange={(e) => updateSelected({ cx: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                CY
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.cy}
                  onChange={(e) => updateSelected({ cy: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                Radius
                <input
                  style={styles.input}
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
            <div style={twoColumnGrid}>
              <label style={styles.inputLabel}>
                X1
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.x1}
                  onChange={(e) => updateSelected({ x1: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                Y1
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.y1}
                  onChange={(e) => updateSelected({ y1: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                X2
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.x2}
                  onChange={(e) => updateSelected({ x2: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                Y2
                <input
                  style={styles.input}
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
            <div style={twoColumnGrid}>
              <label style={styles.inputLabel}>
                CX
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.cx}
                  onChange={(e) => updateSelected({ cx: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                CY
                <input
                  style={styles.input}
                  type="number"
                  value={selectedShape.cy}
                  onChange={(e) => updateSelected({ cy: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={styles.inputLabel}>
                Radius
                <input
                  style={styles.input}
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

              <label style={styles.inputLabel}>
                Start angle
                <input
                  style={styles.input}
                  type="number"
                  step="0.1"
                  value={selectedShape.startAngle}
                  onChange={(e) =>
                    updateSelected({ startAngle: Number(e.target.value) || 0 })
                  }
                />
              </label>

              <label style={styles.inputLabel}>
                End angle
                <input
                  style={styles.input}
                  type="number"
                  step="0.1"
                  value={selectedShape.endAngle}
                  onChange={(e) =>
                    updateSelected({ endAngle: Number(e.target.value) || 0 })
                  }
                />
              </label>
            </div>

            <label style={{ ...checkboxRow, marginTop: 10 }}>
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
          <label style={checkboxRow}>
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
              <div style={twoColumnGrid}>
                <label style={styles.inputLabel}>
                  X
                  <input
                    style={styles.input}
                    type="number"
                    value={selectedShape.x}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={styles.inputLabel}>
                  Y
                  <input
                    style={styles.input}
                    type="number"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={styles.inputLabel}>
                  Width
                  <input
                    style={styles.input}
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

                <label style={styles.inputLabel}>
                  Height
                  <input
                    style={styles.input}
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

                <label style={{ ...styles.inputLabel, gridColumn: "1 / -1" }}>
                  Угол поворота
                  <input
                    style={styles.input}
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

            <label style={checkboxRow}>
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
              <label style={styles.inputLabel}>
                Текст
                <input
                  style={styles.input}
                  type="text"
                  value={selectedShape.text}
                  onChange={(e) => updateSelected({ text: e.target.value })}
                />
              </label>
            </CardBlock>

            <CardBlock>
              <div style={twoColumnGrid}>
                <label style={styles.inputLabel}>
                  X
                  <input
                    style={styles.input}
                    type="number"
                    value={selectedShape.x}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={styles.inputLabel}>
                  Y
                  <input
                    style={styles.input}
                    type="number"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={styles.inputLabel}>
                  Height
                  <input
                    style={styles.input}
                    type="number"
                    value={selectedShape.height}
                    onChange={(e) =>
                      updateSelected({
                        height: clamp(Number(e.target.value) || 2, 2, 100000),
                      })
                    }
                  />
                </label>

                <label style={styles.inputLabel}>
                  Letter spacing
                  <input
                    style={styles.input}
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
              <div style={twoColumnGrid}>
                <label style={styles.inputLabel}>
                  Font
                  <select
                    value={selectedShape.fontFile}
                    onChange={(e) => updateSelected({ fontFile: e.target.value })}
                    style={styles.select}
                  >
                    {DEFAULT_FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>
                        {font.split("/").pop()}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.inputLabel}>
                  Rotation
                  <input
                    style={styles.input}
                    type="number"
                    value={selectedShape.rotation ?? 0}
                    onChange={(e) => updateSelected({ rotation: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={{ ...styles.inputLabel, gridColumn: "1 / -1" }}>
                  Align
                  <select
                    value={selectedShape.align ?? "left"}
                    onChange={(e) => updateSelected({ align: e.target.value })}
                    style={styles.select}
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
          <div style={{ display: "grid", gap: 10 }}>
            <div style={twoColumnGrid}>
              <label style={styles.inputLabel}>
                Operation
                <select
                  value={shapeCamSettings.operation}
                  onChange={(e) =>
                    updateSelectedCam({
                      operation: e.target.value as SketchCamSettings["operation"],
                    })
                  }
                  style={styles.select}
                >
                  <option value="follow-path">Follow path</option>
                  <option value="profile-inside">Profile inside</option>
                  <option value="profile-outside">Profile outside</option>
                  <option value="pocket">Pocket</option>
                </select>
              </label>

              <label style={styles.inputLabel}>
                Direction
                <select
                  value={shapeCamSettings.direction}
                  onChange={(e) =>
                    updateSelectedCam({
                      direction: e.target.value as SketchCamSettings["direction"],
                    })
                  }
                  style={styles.select}
                >
                  <option value="climb">Climb</option>
                  <option value="conventional">Conventional</option>
                </select>
              </label>

              <label style={styles.inputLabel}>
                Stepdown override
                <input
                  style={styles.input}
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

              <label style={styles.inputLabel}>
                Stepover override
                <input
                  style={styles.input}
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

            <label style={checkboxRow}>
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

            <label style={styles.inputLabel}>
              Ramping turns
              <input
                style={styles.input}
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

            <label style={checkboxRow}>
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

            <div style={threeColumnGrid}>
              <label style={styles.inputLabel}>
                Tabs count
                <input
                  style={styles.input}
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

              <label style={styles.inputLabel}>
                Tabs width
                <input
                  style={styles.input}
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

              <label style={styles.inputLabel}>
                Tabs height
                <input
                  style={styles.input}
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
          <div style={{ display: "grid", gap: 10 }}>
            {selectedConstraints.length === 0 ? (
              <div
                style={{
                  ...styles.panelInset,
                  padding: 12,
                  fontSize: 13,
                  color: theme.textMuted,
                }}
              >
                Для этого объекта ограничения ещё не заданы.
              </div>
            ) : (
              selectedConstraints.map((constraint) => (
                <div
                  key={constraint.id}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    padding: 10,
                    display: "grid",
                    gap: 8,
                    background: theme.panelSolid,
                  }}
                >
                  <div style={twoColumnGrid}>
                    <label style={styles.inputLabel}>
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
                        style={styles.select}
                      >
                        <option value="left">Левый</option>
                        <option value="right">Правый</option>
                        <option value="top">Верхний</option>
                        <option value="bottom">Нижний</option>
                      </select>
                    </label>

                    <label style={styles.inputLabel}>
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
                        style={styles.select}
                      >
                        <option value="left">Левый</option>
                        <option value="right">Правый</option>
                        <option value="top">Верхний</option>
                        <option value="bottom">Нижний</option>
                      </select>
                    </label>

                    <label style={styles.inputLabel}>
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
                        style={styles.select}
                      >
                        <option value="sheet">Лист</option>
                        <option value="shape">Объект</option>
                      </select>
                    </label>

                    <label style={styles.inputLabel}>
                      Расстояние
                      <input
                        style={styles.input}
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
                    <label style={styles.inputLabel}>
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
                        style={styles.select}
                      >
                        {otherShapes.map((shape) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <label style={checkboxRow}>
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
                      style={styles.buttonDanger}
                    >
                      Удалить
                    </button>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                    }}
                  >
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

            <div
              style={{
                height: 1,
                background: theme.border,
                margin: "2px 0",
              }}
            />

            <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>
              Добавить ограничение
            </div>

            <div style={twoColumnGrid}>
              <label style={styles.inputLabel}>
                Ребро объекта
                <select
                  value={newConstraintEdge}
                  onChange={(e) => setNewConstraintEdge(e.target.value as ConstraintEdge)}
                  style={styles.select}
                >
                  <option value="left">Левый</option>
                  <option value="right">Правый</option>
                  <option value="top">Верхний</option>
                  <option value="bottom">Нижний</option>
                </select>
              </label>

              <label style={styles.inputLabel}>
                До ребра
                <select
                  value={newTargetEdge}
                  onChange={(e) => setNewTargetEdge(e.target.value as ConstraintEdge)}
                  style={styles.select}
                >
                  <option value="left">Левый</option>
                  <option value="right">Правый</option>
                  <option value="top">Верхний</option>
                  <option value="bottom">Нижний</option>
                </select>
              </label>

              <label style={styles.inputLabel}>
                Цель
                <select
                  value={newTargetKind}
                  onChange={(e) =>
                    setNewTargetKind(
                      e.target.value as SketchDistanceConstraintTarget["kind"],
                    )
                  }
                  style={styles.select}
                >
                  <option value="sheet">Лист</option>
                  <option value="shape">Объект</option>
                </select>
              </label>

              <label style={styles.inputLabel}>
                Расстояние
                <input
                  style={styles.input}
                  type="number"
                  step="0.001"
                  value={newDistance}
                  onChange={(e) => setNewDistance(Number(e.target.value) || 0)}
                />
              </label>
            </div>

            {newTargetKind === "shape" && (
              <label style={styles.inputLabel}>
                Целевой объект
                <select
                  value={newTargetShapeId}
                  onChange={(e) => setNewTargetShapeId(e.target.value)}
                  style={styles.select}
                >
                  {otherShapes.map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {shape.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button type="button" onClick={handleAddConstraint} style={styles.buttonPrimary}>
              Добавить расстояние
            </button>

            {constraintIssues.length > 0 && (
              <div
                style={{
                  borderRadius: 12,
                  border: `1px solid ${theme.danger}`,
                  background: theme.dangerSoft,
                  color: theme.danger,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  Предупреждения по ограничениям
                </div>

                {constraintIssues.map((issue, index) => (
                  <div key={`${issue.constraintId}-${index}`}>
                    • {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardBlock>
      </div>
    </>
  );
}