import { useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiCircle,
  FiEdit3,
  FiImage,
  FiMinus,
  FiMove,
  FiType,
} from "react-icons/fi";
import { clamp } from "../../../utils";
import { theme, ui } from "../../../styles/ui";
import type {
  ConstraintEdge,
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

function CardBlock({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
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

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

const fieldLabel: React.CSSProperties = { ...ui.inputLabel };
const checkboxRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
  fontWeight: 700,
  color: theme.text,
  padding: 12,
  borderRadius: 12,
  background: "#fff",
  border: `1px solid ${theme.border}`,
};

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

export function ShapePropertiesPanel({
  document,
  setDocument,
  selectedShape,
}: ShapePropertiesPanelProps) {
  const otherShapes = useMemo(
    () => document.shapes.filter((shape) => shape.id !== selectedShape.id),
    [document.shapes, selectedShape.id],
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
      <div style={{ height: 1, background: theme.border, margin: "18px 0" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={ui.iconBadge}>{getShapeIcon(selectedShape.type)}</div>
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
        <CardBlock>
          <label style={fieldLabel}>
            Имя
            <input
              style={ui.input}
              type="text"
              value={selectedShape.name}
              onChange={(e) => updateSelected({ name: e.target.value })}
            />
          </label>
        </CardBlock>

        <CardBlock>
          <div style={twoColumnGrid}>
            <label style={fieldLabel}>
              Индивидуальная глубина Z
              <input
                style={ui.input}
                type="number"
                value={selectedShape.cutZ ?? document.cutZ}
                onChange={(e) => updateSelected({ cutZ: Number(e.target.value) || 0 })}
              />
            </label>

            <label style={fieldLabel}>
              Толщина линии
              <input
                style={ui.input}
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
              <label style={fieldLabel}>
                X
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.x}
                  onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                Y
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.y}
                  onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                Width
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.width}
                  onChange={(e) =>
                    updateSelected({
                      width: clamp(Number(e.target.value) || 1, 1, 100000),
                    })
                  }
                />
              </label>

              <label style={fieldLabel}>
                Height
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.height}
                  onChange={(e) =>
                    updateSelected({
                      height: clamp(Number(e.target.value) || 1, 1, 100000),
                    })
                  }
                />
              </label>

              <label style={{ ...fieldLabel, gridColumn: "1 / -1" }}>
                Угол поворота
                <input
                  style={ui.input}
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
              <label style={fieldLabel}>
                CX
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.cx}
                  onChange={(e) => updateSelected({ cx: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                CY
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.cy}
                  onChange={(e) => updateSelected({ cy: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                Radius
                <input
                  style={ui.input}
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
              <label style={fieldLabel}>
                X1
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.x1}
                  onChange={(e) => updateSelected({ x1: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                Y1
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.y1}
                  onChange={(e) => updateSelected({ y1: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                X2
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.x2}
                  onChange={(e) => updateSelected({ x2: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                Y2
                <input
                  style={ui.input}
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
              <label style={fieldLabel}>
                CX
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.cx}
                  onChange={(e) => updateSelected({ cx: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                CY
                <input
                  style={ui.input}
                  type="number"
                  value={selectedShape.cy}
                  onChange={(e) => updateSelected({ cy: Number(e.target.value) || 0 })}
                />
              </label>

              <label style={fieldLabel}>
                Radius
                <input
                  style={ui.input}
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

              <label style={fieldLabel}>
                Start angle
                <input
                  style={ui.input}
                  type="number"
                  step="0.1"
                  value={selectedShape.startAngle}
                  onChange={(e) =>
                    updateSelected({ startAngle: Number(e.target.value) || 0 })
                  }
                />
              </label>

              <label style={fieldLabel}>
                End angle
                <input
                  style={ui.input}
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
                <label style={fieldLabel}>
                  X
                  <input
                    style={ui.input}
                    type="number"
                    value={selectedShape.x}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={fieldLabel}>
                  Y
                  <input
                    style={ui.input}
                    type="number"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={fieldLabel}>
                  Width
                  <input
                    style={ui.input}
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

                <label style={fieldLabel}>
                  Height
                  <input
                    style={ui.input}
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

                <label style={{ ...fieldLabel, gridColumn: "1 / -1" }}>
                  Угол поворота
                  <input
                    style={ui.input}
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
              <label style={fieldLabel}>
                Текст
                <input
                  style={ui.input}
                  type="text"
                  value={selectedShape.text}
                  onChange={(e) => updateSelected({ text: e.target.value })}
                />
              </label>
            </CardBlock>

            <CardBlock>
              <div style={twoColumnGrid}>
                <label style={fieldLabel}>
                  X
                  <input
                    style={ui.input}
                    type="number"
                    value={selectedShape.x}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={fieldLabel}>
                  Y
                  <input
                    style={ui.input}
                    type="number"
                    value={selectedShape.y}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={fieldLabel}>
                  Height
                  <input
                    style={ui.input}
                    type="number"
                    value={selectedShape.height}
                    onChange={(e) =>
                      updateSelected({
                        height: clamp(Number(e.target.value) || 2, 2, 100000),
                      })
                    }
                  />
                </label>

                <label style={fieldLabel}>
                  Letter spacing
                  <input
                    style={ui.input}
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
                <label style={fieldLabel}>
                  Font
                  <select
                    value={selectedShape.fontFile}
                    onChange={(e) => updateSelected({ fontFile: e.target.value })}
                    style={ui.select}
                  >
                    {DEFAULT_FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>
                        {font.split("/").pop()}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={fieldLabel}>
                  Rotation
                  <input
                    style={ui.input}
                    type="number"
                    value={selectedShape.rotation ?? 0}
                    onChange={(e) => updateSelected({ rotation: Number(e.target.value) || 0 })}
                  />
                </label>

                <label style={{ ...fieldLabel, gridColumn: "1 / -1" }}>
                  Align
                  <select
                    value={selectedShape.align ?? "left"}
                    onChange={(e) => updateSelected({ align: e.target.value })}
                    style={ui.select}
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

        <CardBlock title="Расстояния / ограничения">
          <div style={{ display: "grid", gap: 10 }}>
            {selectedConstraints.length === 0 ? (
              <div
                style={{
                  ...ui.panelInset,
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
                    background: "#fff",
                  }}
                >
                  <div style={twoColumnGrid}>
                    <label style={fieldLabel}>
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
                        style={ui.select}
                      >
                        <option value="left">Левый</option>
                        <option value="right">Правый</option>
                        <option value="top">Верхний</option>
                        <option value="bottom">Нижний</option>
                      </select>
                    </label>

                    <label style={fieldLabel}>
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
                        style={ui.select}
                      >
                        <option value="left">Левый</option>
                        <option value="right">Правый</option>
                        <option value="top">Верхний</option>
                        <option value="bottom">Нижний</option>
                      </select>
                    </label>

                    <label style={fieldLabel}>
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
                        style={ui.select}
                      >
                        <option value="sheet">Лист</option>
                        <option value="shape">Объект</option>
                      </select>
                    </label>

                    <label style={fieldLabel}>
                      Расстояние
                      <input
                        style={ui.input}
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
                    <label style={fieldLabel}>
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
                        style={ui.select}
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
                      style={ui.buttonDanger}
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
              <label style={fieldLabel}>
                Ребро объекта
                <select
                  value={newConstraintEdge}
                  onChange={(e) => setNewConstraintEdge(e.target.value as ConstraintEdge)}
                  style={ui.select}
                >
                  <option value="left">Левый</option>
                  <option value="right">Правый</option>
                  <option value="top">Верхний</option>
                  <option value="bottom">Нижний</option>
                </select>
              </label>

              <label style={fieldLabel}>
                До ребра
                <select
                  value={newTargetEdge}
                  onChange={(e) => setNewTargetEdge(e.target.value as ConstraintEdge)}
                  style={ui.select}
                >
                  <option value="left">Левый</option>
                  <option value="right">Правый</option>
                  <option value="top">Верхний</option>
                  <option value="bottom">Нижний</option>
                </select>
              </label>

              <label style={fieldLabel}>
                Цель
                <select
                  value={newTargetKind}
                  onChange={(e) =>
                    setNewTargetKind(
                      e.target.value as SketchDistanceConstraintTarget["kind"],
                    )
                  }
                  style={ui.select}
                >
                  <option value="sheet">Лист</option>
                  <option value="shape">Объект</option>
                </select>
              </label>

              <label style={fieldLabel}>
                Расстояние
                <input
                  style={ui.input}
                  type="number"
                  step="0.001"
                  value={newDistance}
                  onChange={(e) => setNewDistance(Number(e.target.value) || 0)}
                />
              </label>
            </div>

            {newTargetKind === "shape" && (
              <label style={fieldLabel}>
                Целевой объект
                <select
                  value={newTargetShapeId}
                  onChange={(e) => setNewTargetShapeId(e.target.value)}
                  style={ui.select}
                >
                  {otherShapes.map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {shape.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button type="button" onClick={handleAddConstraint} style={ui.buttonPrimary}>
              Добавить расстояние
            </button>

            {constraintIssues.length > 0 && (
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  color: "#9f1239",
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