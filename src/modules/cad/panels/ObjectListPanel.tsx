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

  let contextMenuNode: React.ReactNode = null;

  if (contextMenu && portalHost) {
    const menuShell = "fixed z-[99999] min-w-[180px] rounded-xl border bg-[var(--color-panel)] p-1.5 shadow-[var(--shadow)] backdrop-blur-[16px]";
    const menuItem = "flex h-[30px] w-full items-center gap-2 rounded-lg bg-transparent px-2.5 text-left text-xs font-semibold text-[var(--color-text)]";
    const menuDanger = "text-[var(--color-danger)]";

    if (contextMenu.target.kind === "shape") {
      const target: ShapeMenuTarget = contextMenu.target;

      contextMenuNode = createPortal(
        <div
          ref={menuRef}
          className={menuShell}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            borderColor: "var(--color-border)",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className={menuItem}
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
            className={menuItem}
            onClick={() => beginRenameShape(target.shapeId)}
          >
            <FiEdit3 size={14} />
            Переименовать
          </button>

          <button
            type="button"
            className={menuItem}
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
            className={menuItem}
            onClick={() => {
              navigator.clipboard?.writeText(target.shapeId).catch(() => {});
              setContextMenu(null);
            }}
          >
            <FiCopy size={14} />
            Копировать ID
          </button>

          <div className="mx-1 my-1.5 h-px bg-[var(--color-border)]" />

          <button
            type="button"
            className={`${menuItem} ${menuDanger}`}
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
          className={menuShell}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            borderColor: "var(--color-border)",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className={menuItem}
            onClick={() => beginRenameGroup(target.groupId)}
          >
            <FiEdit3 size={14} />
            Переименовать группу
          </button>

          <button
            type="button"
            className={menuItem}
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
            className={menuItem}
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
        className="ui-panel scrollbar-thin relative flex h-full min-h-0 w-[320px] min-w-[260px] max-w-[360px] flex-col overflow-hidden rounded-2xl p-2"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setContextMenu(null);
          }
        }}
      >
        <div className="mb-2 flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-1 py-1 pb-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">
            <FiLayers size={14} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[13px] leading-none font-extrabold text-[var(--color-text)]">
              Проводник проекта
            </div>
            <div className="mt-0.5 text-[11px] leading-none text-[var(--color-text-muted)]">
              {document.shapes.length} объектов
            </div>
          </div>

          <button
            type="button"
            className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md bg-transparent p-0 text-[var(--color-text-muted)]"
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

        <div className="shrink-0 px-1 pb-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Фильтр объектов..."
            className="ui-input h-8 rounded-[10px] text-xs"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-0.5 pb-1">
          {tree.length === 0 ? (
            <div className="ui-panel-inset rounded-[10px] p-2.5 text-xs text-[var(--color-text-muted)]">
              Ничего не найдено.
            </div>
          ) : (
            <div className="grid gap-px">
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
                      className={node.selected ? "rounded-lg bg-[var(--color-primary-soft)]" : "rounded-lg bg-transparent"}
                    >
                      <div className="flex h-7 items-center gap-1 px-1.5 text-[var(--color-text)] select-none">
                        <button
                          type="button"
                          onClick={() => onToggleGroupCollapsed(node.id)}
                          className="grid h-[18px] w-[18px] place-items-center rounded-md p-0 text-[var(--color-text-muted)]"
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
                          className="flex min-w-0 flex-1 items-center gap-1.5 bg-transparent p-0 text-left text-[var(--color-text)]"
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
                              className="ui-input h-6 rounded-md px-2 text-xs"
                            />
                          ) : (
                            <span className="min-w-0 truncate whitespace-nowrap text-xs font-bold">
                              {node.name}
                            </span>
                          )}
                        </button>

                        {node.arrayBadge && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-extrabold"
                            style={{
                              color: node.arrayBadge.color,
                              background: node.arrayBadge.background,
                              border: `1px solid ${node.arrayBadge.border}`,
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
                          className="grid h-[22px] w-[22px] place-items-center rounded-md bg-transparent p-0 text-[var(--color-text-muted)]"
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
                    className={node.selected ? "rounded-lg bg-[var(--color-primary-soft)]" : "rounded-lg bg-transparent"}
                    style={{ marginLeft: node.depth * 14 }}
                  >
                    <div className="flex h-[26px] items-center gap-1.5 px-1.5 text-[var(--color-text)] select-none">
                      <button
                        type="button"
                        onClick={() => onSelectionChange(selectOnly(node.id))}
                        onDoubleClick={() => beginRenameShape(node.id)}
                        className="flex min-w-0 flex-1 items-center gap-1.5 bg-transparent p-0 text-left text-[var(--color-text)]"
                      >
                        <span
                          className="grid h-[14px] w-[14px] shrink-0 place-items-center text-[var(--color-text-muted)]"
                          style={{ opacity: node.visible ? 1 : 0.6 }}
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
                            className="ui-input h-[22px] rounded-md px-2 text-xs"
                          />
                        ) : (
                          <span
                            className={`min-w-0 truncate whitespace-nowrap text-xs ${
                              node.selected ? "font-bold" : "font-medium"
                            }`}
                            style={{ opacity: node.visible ? 1 : 0.65 }}
                          >
                            {node.name}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleVisibility(node.id)}
                        className="grid h-[22px] w-[22px] place-items-center rounded-md bg-transparent p-0 text-[var(--color-text-muted)]"
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