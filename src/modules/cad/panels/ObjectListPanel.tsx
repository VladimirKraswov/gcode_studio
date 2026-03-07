
// =============================
// FILE: src/modules/cad/panels/ObjectListPanel.tsx
// =============================

import { useMemo, useState } from "react";
import {
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiCircle,
  FiEye,
  FiEyeOff,
  FiImage,
  FiLayers,
  FiMove,
  FiTrash2,
  FiType,
} from "react-icons/fi";
import { theme, ui } from "../../../styles/ui";
import type { SelectionState } from "../model/selection";
import { selectOnly } from "../model/selection";
import type { SketchDocument, SketchShape } from "../model/types";
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

function getShapeIcon(shape: SketchShape) {
  switch (shape.type) {
    case "rectangle":
      return <FiBox size={14} />;
    case "circle":
      return <FiCircle size={14} />;
    case "polyline":
      return <FiMove size={14} />;
    case "text":
      return <FiType size={14} />;
    case "svg":
      return <FiImage size={14} />;
  }
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
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);

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

  return (
    <div
      style={{
        ...ui.panel,
        padding: 12,
        width: 320,
        minWidth: 280,
        maxWidth: 360,
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        borderRadius: 18,
      }}
      className="scrollbar-thin"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={ui.iconBadge}>
          <FiLayers size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>
            Объекты CAD
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>
            Группы, сортировка, видимость и переименование
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.length === 0 && (
          <div style={{ ...ui.panelInset, padding: 12, color: theme.textMuted, fontSize: 13 }}>
            Пока нет объектов.
          </div>
        )}

        {items.map((item) => {
          if (item.kind === "group") {
            const group = getGroupById(document, item.groupId);
            const collapsed = group?.collapsed ?? false;
            const allVisible = item.shapes.every((shape) => shape.visible !== false);
            const selected = item.shapes.every((shape) => selection.ids.includes(shape.id));

            return (
              <div
                key={item.groupId}
                style={{
                  border: `1px solid ${selected ? "#93c5fd" : theme.border}`,
                  borderRadius: 14,
                  background: selected ? "#eff6ff" : "#fff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "10px 12px",
                    background: theme.panelMuted,
                    borderBottom: collapsed ? "none" : `1px solid ${theme.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => onToggleGroupCollapsed(item.groupId)}
                      style={{ ...iconButtonStyle, width: 26, height: 26, borderRadius: 8 }}
                    >
                      {collapsed ? <FiChevronRight size={14} /> : <FiChevronDown size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onSelectionChange({
                          ids: item.shapes.map((shape) => shape.id),
                          primaryId: item.shapes[0]?.id ?? null,
                        })
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontWeight: 800,
                        color: theme.text,
                        minWidth: 0,
                      }}
                    >
                      <FiLayers size={14} />
                      <span>{group?.name ?? `Группа (${item.shapes.length})`}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => item.shapes.forEach((shape) => onToggleVisibility(shape.id))}
                    title={allVisible ? "Скрыть группу" : "Показать группу"}
                    style={iconButtonStyle}
                  >
                    {allVisible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                  </button>
                </div>

                <div style={{ padding: 8, display: "grid", gap: 8 }}>
                  <input
                    type="text"
                    value={group?.name ?? ""}
                    onChange={(e) => onRenameGroup(item.groupId, e.target.value)}
                    style={ui.input}
                  />

                  {!collapsed && item.shapes.map((shape) => {
                    const active = selection.ids.includes(shape.id);
                    return (
                      <ShapeRow
                        key={shape.id}
                        shape={shape}
                        active={active}
                        onSelect={() => onSelectionChange(selectOnly(shape.id))}
                        onRename={(name) => onRenameShape(shape.id, name)}
                        onToggleVisibility={() => onToggleVisibility(shape.id)}
                        onDelete={() => onDeleteShape(shape.id)}
                        onDragStart={() => setDraggedShapeId(shape.id)}
                        onDragOver={() => moveShapeBefore(shape.id)}
                        onDragEnd={() => setDraggedShapeId(null)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          }

          const active = selection.ids.includes(item.shape.id);
          return (
            <ShapeRow
              key={item.shape.id}
              shape={item.shape}
              active={active}
              onSelect={() => onSelectionChange(selectOnly(item.shape.id))}
              onRename={(name) => onRenameShape(item.shape.id, name)}
              onToggleVisibility={() => onToggleVisibility(item.shape.id)}
              onDelete={() => onDeleteShape(item.shape.id)}
              onDragStart={() => setDraggedShapeId(item.shape.id)}
              onDragOver={() => moveShapeBefore(item.shape.id)}
              onDragEnd={() => setDraggedShapeId(null)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ShapeRow({
  shape,
  active,
  onSelect,
  onRename,
  onToggleVisibility,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  shape: SketchShape;
  active: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragEnd={onDragEnd}
      style={{
        border: `1px solid ${active ? "#93c5fd" : theme.border}`,
        borderRadius: 12,
        background: active ? "#eff6ff" : "#fff",
        padding: 10,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          onClick={onSelect}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            color: theme.text,
            fontWeight: 700,
            minWidth: 0,
          }}
        >
          <span style={{ display: "grid", placeItems: "center", width: 20, height: 20 }}>
            {getShapeIcon(shape)}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shape.name}
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button type="button" onClick={onToggleVisibility} style={iconButtonStyle}>
            {shape.visible !== false ? <FiEye size={14} /> : <FiEyeOff size={14} />}
          </button>
          <button type="button" onClick={onDelete} style={iconButtonStyle}>
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      <input type="text" value={shape.name} onChange={(e) => onRename(e.target.value)} style={ui.input} />
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 10,
  border: `1px solid ${theme.border}`,
  background: "#fff",
  color: theme.text,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  padding: 0,
};
