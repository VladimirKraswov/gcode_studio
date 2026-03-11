import { useRef } from "react";
import {
  FiCheck,
  FiCopy,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiImage,
  FiLayers,
  FiMaximize,
  FiTrash2,
  FiX,
  FiRepeat,
  FiRefreshCw,
} from "react-icons/fi";
import type { MirrorAxis, SketchTool } from "../model/types";
import { useToolPlugins } from "../plugins/registry";
import { IconButton } from "@/shared/components/ui/IconButton";

type EditToolbarProps = {
  tool: SketchTool;
  onToolChange: (tool: SketchTool) => void;
  onStartLinearArray: () => void;
  onStartCircularArray: () => void;
  onCommitPolyline: () => void;
  onCancelDraft: () => void;
  onDeleteSelected: () => void;
  onResetView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onImportSvg: (file: File) => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  onCloneSelected: () => void;
  onMirrorSelected: (axis: MirrorAxis) => void;
  canGroupSelected: boolean;
  canUngroupSelected: boolean;
  hasSelection: boolean;
  hasDraft: boolean;
};

function Divider() {
  return <div className="mx-1 h-px bg-[var(--color-border)]" />;
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

export function EditToolbar({
  tool,
  onToolChange,
  onStartLinearArray,
  onStartCircularArray,
  onCommitPolyline,
  onCancelDraft,
  onDeleteSelected,
  onResetView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onImportSvg,
  onGroupSelected,
  onUngroupSelected,
  onCloneSelected,
  onMirrorSelected,
  canGroupSelected,
  canUngroupSelected,
  hasSelection,
  hasDraft,
}: EditToolbarProps) {
  const svgInputRef = useRef<HTMLInputElement>(null);
  const tools = useToolPlugins();

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-md">
      <Group>
        {tools.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            active={tool === item.id}
            onClick={() => onToolChange(item.id)}
            title={`${item.label} (${item.hint})`}
            aria-label={item.label}
          />
        ))}
      </Group>

      <Divider />

      <Group>
        <IconButton
          icon={<FiCornerUpLeft size={16} />}
          disabled={!canUndo}
          onClick={onUndo}
          title="Отменить (Ctrl+Z)"
          aria-label="Отменить"
        />
        <IconButton
          icon={<FiCornerUpRight size={16} />}
          disabled={!canRedo}
          onClick={onRedo}
          title="Повторить (Ctrl+Y)"
          aria-label="Повторить"
        />
      </Group>

      <Divider />

      <Group>
        <IconButton
          icon={<FiImage size={16} />}
          onClick={() => svgInputRef.current?.click()}
          title="Импорт SVG"
          aria-label="Импорт SVG"
        />
        <input
          ref={svgInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportSvg(file);
            e.target.value = "";
          }}
        />
        <IconButton
          icon={<FiMaximize size={16} />}
          onClick={onResetView}
          title="Сбросить вид"
          aria-label="Сбросить вид"
        />
      </Group>

      {hasSelection && (
        <>
          <Divider />

          <Group>
            <IconButton
              icon={<FiCopy size={16} />}
              onClick={onCloneSelected}
              title="Клонировать"
              aria-label="Клонировать"
            />

            <IconButton
              icon={<FiRepeat size={16} />}
              onClick={onStartLinearArray}
              onContextMenu={(e) => {
                e.preventDefault();
                onStartCircularArray();
              }}
              title="Массив (ЛКМ — линейный, ПКМ — круговой)"
              aria-label="Массив"
            />

            <IconButton
              icon={<FiRefreshCw size={16} />}
              onClick={() => onMirrorSelected("x")}
              title="Отразить"
              aria-label="Отразить"
            />

            <IconButton
              icon={<FiLayers size={16} />}
              disabled={!canGroupSelected}
              onClick={onGroupSelected}
              title="Группировать"
              aria-label="Группировать"
            />

            <IconButton
              icon={<FiX size={16} />}
              disabled={!canUngroupSelected}
              onClick={onUngroupSelected}
              title="Разгруппировать"
              aria-label="Разгруппировать"
            />

            <IconButton
              icon={<FiTrash2 size={16} />}
              variant="danger"
              onClick={onDeleteSelected}
              title="Удалить"
              aria-label="Удалить"
            />
          </Group>
        </>
      )}

      {hasDraft && (
        <>
          <Divider />

          <Group>
            <IconButton
              icon={<FiCheck size={16} />}
              variant="success"
              onClick={onCommitPolyline}
              title="Применить"
              aria-label="Применить"
            />
            <IconButton
              icon={<FiX size={16} />}
              variant="danger"
              onClick={onCancelDraft}
              title="Отмена"
              aria-label="Отмена"
            />
          </Group>
        </>
      )}
    </div>
  );
}