import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import {
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiCircle,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiImage,
  FiLayers,
  FiMinus,
  FiMove,
  FiTrash2,
  FiType,
  FiSearch,
  FiHash,
  FiFolder,
  FiSave,
} from "react-icons/fi";
import type { SelectionState } from "../model/selection";
import {
  makeConstraintRef,
  makeShapeRef,
  selectOnly,
} from "../model/selection";
import type {
  SketchArrayDefinition,
  SketchDocument,
  SketchShape,
  SketchConstraint,
} from "../model/types";
import { getGroupById } from "../model/grouping";
import { Badge } from "@/shared/components/ui/Badge";
import { Input } from "@/shared/components/ui/Input";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useUI } from "@/contexts/UIContext";

type ObjectListPanelProps = {
  document: SketchDocument;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
  onRenameShape: (shapeId: string, name: string) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onToggleVisibility: (shapeId: string) => void;
  onDeleteShape: (shapeId: string) => void;
  onDeleteConstraint?: (constraintId: string) => void;
  onReorderShapes: (orderedIds: string[]) => void;
  onSaveProject?: () => void;
  onLoadProject?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

type ListItem =
  | { kind: "group"; groupId: string; shapes: SketchShape[] }
  | { kind: "shape"; shape: SketchShape }
  | { kind: "constraint"; constraint: SketchConstraint };

type TreeNode =
  | {
      kind: "group";
      id: string;
      name: string;
      depth: number;
      collapsed: boolean;
      selected: boolean;
      visible: boolean;
      arrayBadge: { label: string; variant: "info" | "purple" } | null;
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
    }
  | {
      kind: "constraint";
      id: string;
      name: string;
      depth: number;
      selected: boolean;
      constraint: SketchConstraint;
    };

type MenuTarget =
  | { kind: "group"; groupId: string }
  | { kind: "shape"; shapeId: string }
  | { kind: "constraint"; constraintId: string };

type ShapeMenuTarget = Extract<MenuTarget, { kind: "shape" }>;
type GroupMenuTarget = Extract<MenuTarget, { kind: "group" }>;
type ConstraintMenuTarget = Extract<MenuTarget, { kind: "constraint" }>;

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
    case "rectangle": return <FiBox size={13} />;
    case "circle": return <FiCircle size={13} />;
    case "line": return <FiMinus size={13} />;
    case "arc": return <FiCircle size={13} />;
    case "polyline": return <FiMove size={13} />;
    case "text": return <FiType size={13} />;
    case "svg": return <FiImage size={13} />;
    default: return <FiBox size={13} />;
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

function getArrayBadgeMeta(array: SketchArrayDefinition | null | undefined): { label: string; variant: "info" | "purple" } | null {
  if (!array) return null;
  if (array.type === "linear") {
    return { label: "LIN", variant: "info" };
  }
  return { label: "CIR", variant: "purple" };
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
  onDeleteConstraint = () => {},
  onReorderShapes,
  onSaveProject,
  onLoadProject,
}: ObjectListPanelProps) {
  const { t } = useTranslation();
  const getConstraintLabel = useConstraintLabel();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { setHint } = useUI();

  const [activeTab, setActiveTab] = useState("objects");
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

    for (const constraint of document.constraints) {
      result.push({ kind: "constraint", constraint });
    }

    return result;
  }, [document.groups, document.shapes, document.constraints]);

  const tree = useMemo<TreeNode[]>(() => {
    const q = filter.trim().toLowerCase();
    const nodes: TreeNode[] = [];

    for (const item of items) {
      if (activeTab === "objects") {
        if (item.kind === "group") {
          const group = getGroupById(document, item.groupId);
          const collapsed = group?.collapsed ?? false;
          const selected =
            item.shapes.length > 0 &&
            item.shapes.every((shape) =>
              selection.refs.some((ref) => ref.kind === "shape" && ref.id === shape.id),
            );
          const visible = item.shapes.some((shape) => shape.visible !== false);
          const arrayBadge = getArrayBadgeMeta(group?.array);

          const groupMatches = !q || (group?.name ?? "").toLowerCase().includes(q);
          const matchedShapes = q
            ? item.shapes.filter((shape) => shape.name.toLowerCase().includes(q))
            : item.shapes;

          if (!groupMatches && matchedShapes.length === 0) continue;

          nodes.push({
            kind: "group",
            id: item.groupId,
            name: group?.name ?? t("cad.objects.group_default", { count: item.shapes.length }),
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
                selected: selection.refs.some((ref) => ref.kind === "shape" && ref.id === shape.id),
                visible: shape.visible !== false,
                shape,
                parentGroupId: item.groupId,
              });
            }
          }
          continue;
        }

        if (item.kind === "shape") {
          if (q && !item.shape.name.toLowerCase().includes(q)) continue;

          nodes.push({
            kind: "shape",
            id: item.shape.id,
            name: item.shape.name,
            depth: 0,
            selected: selection.refs.some((ref) => ref.kind === "shape" && ref.id === item.shape.id),
            visible: item.shape.visible !== false,
            shape: item.shape,
            parentGroupId: null,
          });
          continue;
        }
      } else {
        if (item.kind === "constraint") {
          const name = getConstraintLabel(item.constraint);
          if (q && !name.toLowerCase().includes(q)) continue;

          nodes.push({
            kind: "constraint",
            id: item.constraint.id,
            name,
            depth: 0,
            selected: selection.refs.some((ref) => ref.kind === "constraint" && ref.id === item.constraint.id),
            constraint: item.constraint,
          });
        }
      }
    }
    return nodes;
  }, [document, filter, items, selection.refs, activeTab]);

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
    setRenaming({ kind: "group", id: groupId, value: group?.name ?? "" });
    setContextMenu(null);
  }

  function beginRenameShape(shapeId: string) {
    const shape = document.shapes.find((item) => item.id === shapeId);
    setRenaming({ kind: "shape", id: shapeId, value: shape?.name ?? "" });
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
    setContextMenu({ x: event.clientX, y: event.clientY, target });
  }

  useEffect(() => {
    function closeMenu() { setContextMenu(null); }
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      if (target && rootRef.current?.contains(target)) return;
      closeMenu();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { closeMenu(); setRenaming(null); }
      if (event.key === "F2" && selection.primaryRef?.kind === "shape") {
        beginRenameShape(selection.primaryRef.id);
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
  }, [selection.primaryRef, document.shapes]);

  let contextMenuNode: React.ReactNode = null;
  if (contextMenu && portalHost) {
    const menuShell = "fixed z-[99999] min-w-[180px] rounded-lg border border-border bg-panel-solid p-1 shadow-lg backdrop-blur-md";
    const menuItem = "flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium text-text hover:bg-panel-muted transition-colors";
    const menuDanger = "text-danger hover:bg-danger-soft";

    if (contextMenu.target.kind === "shape") {
      const target: ShapeMenuTarget = contextMenu.target;
      contextMenuNode = createPortal(
        <div
          ref={menuRef}
          className={menuShell}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button type="button" className={menuItem} onClick={() => { onSelectionChange(selectOnly(makeShapeRef(target.shapeId))); setContextMenu(null); }}>
            <FiLayers size={14} /> {t("cad.objects.menu.select")}
          </button>
          <button type="button" className={menuItem} onClick={() => beginRenameShape(target.shapeId)}>
            <FiEdit3 size={14} /> {t("cad.objects.menu.rename")}
          </button>
          <button type="button" className={menuItem} onClick={() => { onToggleVisibility(target.shapeId); setContextMenu(null); }}>
            <FiEye size={14} /> {t("cad.objects.menu.toggle_visibility")}
          </button>
          <div className="my-1 h-px bg-border" />
          <button type="button" className={`${menuItem} ${menuDanger}`} onClick={() => { onDeleteShape(target.shapeId); setContextMenu(null); }}>
            <FiTrash2 size={14} /> {t("cad.objects.menu.delete")}
          </button>
        </div>,
        portalHost,
      );
    } else if (contextMenu.target.kind === "group") {
      const target: GroupMenuTarget = contextMenu.target;
      contextMenuNode = createPortal(
        <div
          ref={menuRef}
          className={menuShell}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button type="button" className={menuItem} onClick={() => beginRenameGroup(target.groupId)}>
            <FiEdit3 size={14} /> {t("cad.objects.menu.rename_group")}
          </button>
          <button type="button" className={menuItem} onClick={() => { onToggleGroupCollapsed(target.groupId); setContextMenu(null); }}>
            <FiChevronRight size={14} /> {t("cad.objects.menu.toggle_expand")}
          </button>
          <button type="button" className={menuItem} onClick={() => { openArrayEditor(target.groupId); setContextMenu(null); }}>
            <FiLayers size={14} /> {t("cad.objects.menu.edit_array")}
          </button>
        </div>,
        portalHost,
      );
    } else {
      const target: ConstraintMenuTarget = contextMenu.target;
      contextMenuNode = createPortal(
        <div
          ref={menuRef}
          className={menuShell}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button type="button" className={menuItem} onClick={() => { onSelectionChange(selectOnly(makeConstraintRef(target.constraintId))); setContextMenu(null); }}>
            <FiHash size={14} /> {t("cad.objects.menu.select")}
          </button>
          <div className="my-1 h-px bg-border" />
          <button type="button" className={`${menuItem} ${menuDanger}`} onClick={() => { onDeleteConstraint(target.constraintId); setContextMenu(null); }}>
            <FiTrash2 size={14} /> {t("cad.objects.menu.delete_constraint")}
          </button>
        </div>,
        portalHost,
      );
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col h-full overflow-hidden">
      <div className="p-2 flex items-center justify-between border-b border-border bg-panel-muted/5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1">
          {t("cad.objects.title")}
        </div>
        <div className="flex items-center gap-1">
          {onLoadProject && (
            <label className="cursor-pointer group">
              <div
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-panel-muted transition-colors"
                onMouseEnter={() => setHint(t("common.open"))}
                onMouseLeave={() => setHint("")}
              >
                <FiFolder size={15} />
              </div>
              <input
                type="file"
                accept=".gs,application/json"
                className="hidden"
                onChange={onLoadProject}
              />
            </label>
          )}
          {onSaveProject && (
            <button
              onClick={onSaveProject}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-panel-muted transition-colors"
              onMouseEnter={() => setHint(t("common.save"))}
              onMouseLeave={() => setHint("")}
            >
              <FiSave size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="p-1 border-b border-border bg-panel-muted/10">
        <Tabs
            tabs={[
                { id: "objects", label: t("cad.objects.tabs.objects"), icon: <FiBox size={13} /> },
                { id: "constraints", label: t("cad.objects.tabs.constraints"), icon: <FiHash size={13} /> }
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pill"
        />
      </div>

      <div className="p-2 border-b border-border">
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("cad.objects.search_placeholder")}
            className="h-8 pl-8 text-[12px] bg-panel-muted border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-1">
        {tree.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">{t("cad.objects.no_items")}</div>
        ) : (
          <div className="space-y-px">
            {tree.map((node) => {
              const isRenaming = renaming && renaming.kind === node.kind && renaming.id === node.id;
              const isGroup = node.kind === "group";
              const isConstraint = node.kind === "constraint";

              return (
                <div
                  key={`${node.kind}-${node.id}`}
                  draggable={!isGroup && !isConstraint}
                  onDragStart={() => !isGroup && !isConstraint && setDraggedShapeId(node.id)}
                  onDragOver={(e) => { e.preventDefault(); !isGroup && !isConstraint && moveShapeBefore(node.id); }}
                  onDragEnd={() => setDraggedShapeId(null)}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      node.kind === "group"
                        ? { kind: "group", groupId: node.id }
                        : node.kind === "shape"
                          ? { kind: "shape", shapeId: node.id }
                          : { kind: "constraint", constraintId: node.id },
                    )
                  }
                  className={`group flex items-center gap-1 h-7 px-2 rounded-md transition-colors select-none ${
                    node.selected ? "bg-primary-soft text-primary-text" : "hover:bg-panel-muted text-text"
                  }`}
                  style={{ marginLeft: node.depth * 12 }}
                >
                  {isGroup ? (
                    <button
                      onClick={() => onToggleGroupCollapsed(node.id)}
                      onMouseEnter={() => setHint(node.collapsed ? t("cad.objects.hint.expand") : t("cad.objects.hint.collapse"))}
                      onMouseLeave={() => setHint("")}
                      className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text hover:scale-125 transition-transform"
                    >
                      {node.collapsed ? <FiChevronRight size={14} /> : <FiChevronDown size={14} />}
                    </button>
                  ) : isConstraint ? (
                    <div className="w-4 flex items-center justify-center text-text-muted">
                      <FiHash size={13} />
                    </div>
                  ) : (
                    <div className="w-4 flex items-center justify-center text-text-muted">
                      {getShapeIcon(node.shape)}
                    </div>
                  )}

                  <div
                    className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer h-full"
                    onClick={() => {
                      if (isGroup) {
                        onSelectionChange({
                          refs: node.shapes.map((shape) => makeShapeRef(shape.id)),
                          primaryRef: node.shapes[0] ? makeShapeRef(node.shapes[0].id) : null,
                          ids: node.shapes.map((shape) => shape.id),
                          primaryId: node.shapes[0]?.id ?? null,
                        });
                      } else if (node.kind === "shape") {
                        onSelectionChange(selectOnly(makeShapeRef(node.id)));
                      } else {
                        onSelectionChange(selectOnly(makeConstraintRef(node.id)));
                      }
                    }}
                    onDoubleClick={() => {
                      if (isGroup) beginRenameGroup(node.id);
                      else if (node.kind === "shape") beginRenameShape(node.id);
                    }}
                  >
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renaming.value}
                        onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                        onBlur={commitRename}
                        onKeyDown={(e) => e.key === "Enter" && commitRename()}
                        className="w-full h-5 bg-panel-solid border border-primary rounded px-1 text-xs outline-none"
                      />
                    ) : (
                      <span className={`text-[12px] truncate ${node.selected ? "font-bold" : "font-medium"} ${"visible" in node && !node.visible ? "opacity-40" : ""}`}>
                        {node.name}
                      </span>
                    )}
                  </div>

                  {isGroup && node.arrayBadge && (
                    <Badge variant={node.arrayBadge.variant} className="h-3.5 px-1 py-0">
                      {node.arrayBadge.label}
                    </Badge>
                  )}

                  {node.kind === "shape" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleVisibility(node.id); }}
                      onMouseEnter={() => setHint(node.visible ? t("cad.objects.hint.hide") : t("cad.objects.hint.show"))}
                      onMouseLeave={() => setHint("")}
                      className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 hover:scale-110 transition-all ${node.visible ? "text-text-muted opacity-0 group-hover:opacity-100" : "text-primary opacity-100"}`}
                    >
                      {node.visible ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contextMenuNode}
    </div>
  );
}
