import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiCircle,
  FiCopy,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiFolder,
  FiImage,
  FiLayers,
  FiMinus,
  FiMoreHorizontal,
  FiMove,
  FiTrash2,
  FiType,
} from "react-icons/fi";
import { useStyles } from "../../../styles/useStyles";
import { useTheme } from "../../../contexts/ThemeContext";
import type { SelectionState } from "../model/selection";
import { selectOnly } from "../model/selection";
import type {
  SketchArrayDefinition,
  SketchDocument,
  SketchShape,
} from "../model/types";
import { getGroupById } from "../model/grouping";

type ObjectListPanelProps = {
  document: SketchDocument;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
  onRenameShape: (shapeId: string, name: string) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onToggleVisibility: (shapeId: string) => void;
  onDeleteShape: (shapeId: string) => void;
  onReorderShapes: (orderedIds: string[]) => void;
};

type ListItem =
  | { kind: "group"; groupId: string; shapes: SketchShape[] }
  | { kind: "shape"; shape: SketchShape };

type TreeNode =
  | {
      kind: "group";
      id: string;
      name: string;
      depth: number;
      collapsed: boolean;
      selected: boolean;
      visible: boolean;
      arrayBadge: ReturnType<typeof getArrayBadgeMeta>;
      shapes: SketchShape[];
    }
  | {
      kind: "shape";
      id: string;
      name: string;
      depth: number;
      selected: boolean;
      visible: boolean;
      shape: SketchShape;
      parentGroupId: string | null;
    };

type MenuTarget =
  | { kind: "group"; groupId: string }
  | { kind: "shape"; shapeId: string };

type ShapeMenuTarget = Extract<MenuTarget, { kind: "shape" }>;
type GroupMenuTarget = Extract<MenuTarget, { kind: "group" }>;

type ContextMenuState =
  | {
      x: number;
      y: number;
      target: MenuTarget;
    }
  | null;

const EDIT_ARRAY_GROUP_EVENT = "cad:edit-array-group";

function getShapeIcon(shape: SketchShape) {
  switch (shape.type) {
    case "rectangle":
      return <FiBox size={13} />;
    case "circle":
      return <FiCircle size={13} />;
    case "line":
      return <FiMinus size={13} />;
    case "arc":
      return <FiCircle size={13} />;
    case "polyline":
      return <FiMove size={13} />;
    case "text":
      return <FiType size={13} />;
    case "svg":
      return <FiImage size={13} />;
    default:
      return <FiBox size={13} />;
  }
}

function getArrayBadgeMeta(array: SketchArrayDefinition | null | undefined) {
  if (!array) return null;

  if (array.type === "linear") {
    return {
      label: "LIN",
      background: "#ecfeff",
      border: "#a5f3fc",
      color: "#155e75",
    };
  }

  return {
    label: "CIR",
    background: "#f5f3ff",
    border: "#c4b5fd",
    color: "#5b21b6",
  };
}

function openArrayEditor(groupId: string) {
  window.dispatchEvent(
    new CustomEvent(EDIT_ARRAY_GROUP_EVENT, {
      detail: { groupId },
    }),
  );
}

export function ObjectListPanel({
  document,
  selection,
  onSelectionChange,
  onRenameShape,
  onRenameGroup,
  onToggleGroupCollapsed,
  onToggleVisibility,
  onDeleteShape,
  onReorderShapes,
}: ObjectListPanelProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [renaming, setRenaming] = useState<
    | null
    | { kind: "group"; id: string; value: string }
    | { kind: "shape"; id: string; value: string }
  >(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPortalHost(window.document.body);
    }
  }, []);

  const items = useMemo<ListItem[]>(() => {
    const groupMap = new Map<string, SketchShape[]>();
    const ungrouped: SketchShape[] = [];

    for (const shape of document.shapes) {
      if (shape.groupId) {
        const bucket = groupMap.get(shape.groupId) ?? [];
        bucket.push(shape);
        groupMap.set(shape.groupId, bucket);
      } else {
        ungrouped.push(shape);
      }
    }

    const result: ListItem[] = [];

    for (const group of document.groups) {
      const shapes = groupMap.get(group.id) ?? [];
      if (shapes.length > 0) {
        result.push({ kind: "group", groupId: group.id, shapes });
      }
    }

    for (const shape of ungrouped) {
      result.push({ kind: "shape", shape });
    }

    return result;
  }, [document.groups, document.shapes]);

  const tree = useMemo<TreeNode[]>(() => {
    const q = filter.trim().toLowerCase();
    const nodes: TreeNode[] = [];

    for (const item of items) {
      if (item.kind === "group") {
        const group = getGroupById(document, item.groupId);
        const collapsed = group?.collapsed ?? false;
        const selected =
          item.shapes.length > 0 &&
          item.shapes.every((shape) => selection.ids.includes(shape.id));
        const visible = item.shapes.some((shape) => shape.visible !== false);
        const arrayBadge = getArrayBadgeMeta(group?.array);

        const groupMatches = !q || (group?.name ?? "").toLowerCase().includes(q);
        const matchedShapes = q
          ? item.shapes.filter((shape) => shape.name.toLowerCase().includes(q))
          : item.shapes;

        if (!groupMatches && matchedShapes.length === 0) {
          continue;
        }

        nodes.push({
          kind: "group",
          id: item.groupId,
          name: group?.name ?? `Группа (${item.shapes.length})`,
          depth: 0,
          collapsed,
          selected,
          visible,
          arrayBadge,
          shapes: item.shapes,
        });

        if (!collapsed || q) {
          const shapesToShow = groupMatches && !q ? item.shapes : matchedShapes;
          for (const shape of shapesToShow) {
            nodes.push({
              kind: "shape",
              id: shape.id,
              name: shape.name,
              depth: 1,
              selected: selection.ids.includes(shape.id),
              visible: shape.visible !== false,
              shape,
              parentGroupId: item.groupId,
            });
          }
        }

        continue;
      }

      if (q && !item.shape.name.toLowerCase().includes(q)) {
        continue;
      }

      nodes.push({
        kind: "shape",
        id: item.shape.id,
        name: item.shape.name,
        depth: 0,
        selected: selection.ids.includes(item.shape.id),
        visible: item.shape.visible !== false,
        shape: item.shape,
        parentGroupId: null,
      });
    }

    return nodes;
  }, [document, filter, items, selection.ids]);

  function moveShapeBefore(targetShapeId: string) {
    if (!draggedShapeId || draggedShapeId === targetShapeId) return;

    const ids = document.shapes.map((shape) => shape.id);
    const from = ids.indexOf(draggedShapeId);
    const to = ids.indexOf(targetShapeId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorderShapes(next);
  }

  function beginRenameGroup(groupId: string) {
    const group = getGroupById(document, groupId);
    setRenaming({
      kind: "group",
      id: groupId,
      value: group?.name ?? "",
    });
    setContextMenu(null);
  }

  function beginRenameShape(shapeId: string) {
    const shape = document.shapes.find((item) => item.id === shapeId);
    setRenaming({
      kind: "shape",
      id: shapeId,
      value: shape?.name ?? "",
    });
    setContextMenu(null);
  }

  function commitRename() {
    if (!renaming) return;

    const value = renaming.value.trim();
    if (!value) {
      setRenaming(null);
      return;
    }

    if (renaming.kind === "group") {
      onRenameGroup(renaming.id, value);
    } else {
      onRenameShape(renaming.id, value);
    }

    setRenaming(null);
  }

  function handleContextMenu(event: React.MouseEvent, target: MenuTarget) {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target,
    });
  }

  useEffect(() => {
    function closeMenu() {
      setContextMenu(null);
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;

      if (target && menuRef.current?.contains(target)) return;
      if (target && rootRef.current?.contains(target)) return;

      closeMenu();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        setRenaming(null);
      }

      if (event.key === "F2" && selection.primaryId) {
        beginRenameShape(selection.primaryId);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [selection.primaryId, document.shapes]);

  const compactIconButton: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: "none",
    background: "transparent",
    color: theme.textMuted,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  };

  const menuItemStyle: React.CSSProperties = {
    height: 30,
    padding: "0 10px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: theme.text,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  };

  let contextMenuNode: React.ReactNode = null;

  if (contextMenu && portalHost) {
    const menuShellStyle: React.CSSProperties = {
      position: "fixed",
      left: contextMenu.x,
      top: contextMenu.y,
      zIndex: 99999,
      minWidth: 180,
      padding: 6,
      borderRadius: 12,
      background: theme.panel,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
      backdropFilter: "blur(16px)",
    };

    if (contextMenu.target.kind === "shape") {
      const target: ShapeMenuTarget = contextMenu.target;

      contextMenuNode = createPortal(
        <div
          ref={menuRef}
          style={menuShellStyle}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            style={menuItemStyle}
            onClick={() => {
              onSelectionChange(selectOnly(target.shapeId));
              setContextMenu(null);
            }}
          >
            <FiLayers size={14} />
            Выбрать
          </button>

          <button
            type="button"
            style={menuItemStyle}
            onClick={() => beginRenameShape(target.shapeId)}
          >
            <FiEdit3 size={14} />
            Переименовать
          </button>

          <button
            type="button"
            style={menuItemStyle}
            onClick={() => {
              onToggleVisibility(target.shapeId);
              setContextMenu(null);
            }}
          >
            <FiEye size={14} />
            Скрыть / показать
          </button>

          <button
            type="button"
            style={menuItemStyle}
            onClick={() => {
              navigator.clipboard?.writeText(target.shapeId).catch(() => {});
              setContextMenu(null);
            }}
          >
            <FiCopy size={14} />
            Копировать ID
          </button>

          <div
            style={{
              height: 1,
              background: theme.border,
              margin: "6px 4px",
            }}
          />

          <button
            type="button"
            style={{ ...menuItemStyle, color: theme.danger }}
            onClick={() => {
              onDeleteShape(target.shapeId);
              setContextMenu(null);
            }}
          >
            <FiTrash2 size={14} />
            Удалить
          </button>
        </div>,
        portalHost,
      );
    } else {
      const target: GroupMenuTarget = contextMenu.target;

      contextMenuNode = createPortal(
        <div
          ref={menuRef}
          style={menuShellStyle}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            style={menuItemStyle}
            onClick={() => beginRenameGroup(target.groupId)}
          >
            <FiEdit3 size={14} />
            Переименовать группу
          </button>

          <button
            type="button"
            style={menuItemStyle}
            onClick={() => {
              onToggleGroupCollapsed(target.groupId);
              setContextMenu(null);
            }}
          >
            <FiChevronRight size={14} />
            Свернуть / развернуть
          </button>

          <button
            type="button"
            style={menuItemStyle}
            onClick={() => {
              openArrayEditor(target.groupId);
              setContextMenu(null);
            }}
          >
            <FiLayers size={14} />
            Редактировать массив
          </button>
        </div>,
        portalHost,
      );
    }
  }

  return (
    <>
      <div
        ref={rootRef}
        style={{
          ...styles.panel,
          padding: 8,
          width: 320,
          minWidth: 260,
          maxWidth: 360,
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
        className="scrollbar-thin"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setContextMenu(null);
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 4px 8px",
            borderBottom: `1px solid ${theme.border}`,
            marginBottom: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
              background: theme.primarySoft,
              color: theme.primaryText,
              flexShrink: 0,
            }}
          >
            <FiLayers size={14} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: theme.text,
                lineHeight: 1.1,
              }}
            >
              Проводник проекта
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.textMuted,
                marginTop: 2,
                lineHeight: 1.1,
              }}
            >
              {document.shapes.length} объектов
            </div>
          </div>

          <button
            type="button"
            style={compactIconButton}
            title="Дополнительно"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              const rect = e.currentTarget.getBoundingClientRect();

              let menuTarget: MenuTarget | null = null;

              if (selection.primaryId) {
                menuTarget = { kind: "shape", shapeId: selection.primaryId };
              } else if (document.groups[0]?.id) {
                menuTarget = { kind: "group", groupId: document.groups[0].id };
              }

              if (!menuTarget) return;

              setContextMenu({
                x: rect.right - 8,
                y: rect.bottom + 4,
                target: menuTarget,
              });
            }}
          >
            <FiMoreHorizontal size={14} />
          </button>
        </div>

        <div style={{ padding: "0 4px 8px", flexShrink: 0 }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Фильтр объектов..."
            style={{
              ...styles.input,
              height: 32,
              fontSize: 12,
              borderRadius: 10,
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0 2px 4px",
          }}
        >
          {tree.length === 0 ? (
            <div
              style={{
                ...styles.panelInset,
                padding: 10,
                color: theme.textMuted,
                fontSize: 12,
                borderRadius: 10,
              }}
            >
              Ничего не найдено.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 1 }}>
              {tree.map((node) => {
                const isRenaming =
                  renaming &&
                  renaming.kind === node.kind &&
                  renaming.id === node.id;

                if (node.kind === "group") {
                  return (
                    <div
                      key={`group-${node.id}`}
                      onContextMenu={(e) =>
                        handleContextMenu(e, { kind: "group", groupId: node.id })
                      }
                      style={{
                        borderRadius: 8,
                        background: node.selected ? theme.primarySoft : "transparent",
                      }}
                    >
                      <div
                        style={{
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "0 6px",
                          color: theme.text,
                          userSelect: "none",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleGroupCollapsed(node.id)}
                          style={{
                            ...compactIconButton,
                            width: 18,
                            height: 18,
                            color: theme.textMuted,
                          }}
                        >
                          {node.collapsed ? (
                            <FiChevronRight size={12} />
                          ) : (
                            <FiChevronDown size={12} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onSelectionChange({
                              ids: node.shapes.map((shape) => shape.id),
                              primaryId: node.shapes[0]?.id ?? null,
                            })
                          }
                          onDoubleClick={() => beginRenameGroup(node.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            minWidth: 0,
                            flex: 1,
                            cursor: "pointer",
                            color: theme.text,
                            textAlign: "left",
                          }}
                        >
                          <FiFolder size={13} />
                          {isRenaming ? (
                            <input
                              autoFocus
                              value={renaming.value}
                              onChange={(e) =>
                                setRenaming((prev) =>
                                  prev ? { ...prev, value: e.target.value } : prev,
                                )
                              }
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitRename();
                                if (e.key === "Escape") setRenaming(null);
                              }}
                              style={{
                                ...styles.input,
                                height: 24,
                                fontSize: 12,
                                borderRadius: 6,
                                padding: "0 8px",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {node.name}
                            </span>
                          )}
                        </button>

                        {node.arrayBadge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: node.arrayBadge.color,
                              background: node.arrayBadge.background,
                              border: `1px solid ${node.arrayBadge.border}`,
                              borderRadius: 999,
                              padding: "1px 6px",
                              flexShrink: 0,
                            }}
                          >
                            {node.arrayBadge.label}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            node.shapes.forEach((shape) => onToggleVisibility(shape.id))
                          }
                          style={compactIconButton}
                          title={node.visible ? "Скрыть группу" : "Показать группу"}
                        >
                          {node.visible ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`shape-${node.id}`}
                    draggable
                    onDragStart={() => setDraggedShapeId(node.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      moveShapeBefore(node.id);
                    }}
                    onDragEnd={() => setDraggedShapeId(null)}
                    onContextMenu={(e) =>
                      handleContextMenu(e, { kind: "shape", shapeId: node.id })
                    }
                    style={{
                      marginLeft: node.depth * 14,
                      borderRadius: 8,
                      background: node.selected ? theme.primarySoft : "transparent",
                    }}
                  >
                    <div
                      style={{
                        height: 26,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0 6px",
                        color: theme.text,
                        userSelect: "none",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectionChange(selectOnly(node.id))}
                        onDoubleClick={() => beginRenameShape(node.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          minWidth: 0,
                          flex: 1,
                          cursor: "pointer",
                          color: theme.text,
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            display: "grid",
                            placeItems: "center",
                            color: theme.textMuted,
                            opacity: node.visible ? 1 : 0.6,
                            flexShrink: 0,
                          }}
                        >
                          {getShapeIcon(node.shape)}
                        </span>

                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renaming.value}
                            onChange={(e) =>
                              setRenaming((prev) =>
                                prev ? { ...prev, value: e.target.value } : prev,
                              )
                            }
                            onBlur={commitRename}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename();
                              if (e.key === "Escape") setRenaming(null);
                            }}
                            style={{
                              ...styles.input,
                              height: 22,
                              fontSize: 12,
                              borderRadius: 6,
                              padding: "0 8px",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: 12,
                              fontWeight: node.selected ? 700 : 500,
                              opacity: node.visible ? 1 : 0.65,
                            }}
                          >
                            {node.name}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleVisibility(node.id)}
                        style={compactIconButton}
                        title={node.visible ? "Скрыть" : "Показать"}
                      >
                        {node.visible ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {contextMenuNode}
    </>
  );
}