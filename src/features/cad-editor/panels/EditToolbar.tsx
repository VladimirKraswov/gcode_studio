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
    <div className="flex flex-col gap-2 p-1 bg-panel border border-border rounded-xl shadow-lg pointer-events-auto">
      <div className="flex flex-col gap-1">
        {tools.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            active={tool === item.id}
            onClick={() => onToolChange(item.id)}
            title={`${item.label} (${item.hint})`}
          />
        ))}
      </div>

      <div className="h-px bg-border mx-1" />

      <div className="flex flex-col gap-1">
        <IconButton
          icon={<FiCornerUpLeft size={16} />}
          disabled={!canUndo}
          onClick={onUndo}
          title="Отменить (Ctrl+Z)"
        />
        <IconButton
          icon={<FiCornerUpRight size={16} />}
          disabled={!canRedo}
          onClick={onRedo}
          title="Повторить (Ctrl+Y)"
        />
      </div>

      <div className="h-px bg-border mx-1" />

      <div className="flex flex-col gap-1">
        <IconButton
          icon={<FiImage size={16} />}
          onClick={() => svgInputRef.current?.click()}
          title="Импорт SVG"
        />
        <input
          ref={svgInputRef}
          type="file"
          accept=".svg"
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
        />
      </div>

      {hasSelection && (
        <>
          <div className="h-px bg-border mx-1" />
          <div className="flex flex-col gap-1">
            <IconButton
              icon={<FiCopy size={16} />}
              onClick={onCloneSelected}
              title="Клонировать"
            />
             <IconButton
              icon={<FiRepeat size={16} />}
              onClick={onStartLinearArray}
              onContextMenu={(e) => {
                e.preventDefault();
                onStartCircularArray();
              }}
              title="Массив (ЛКМ - лин, ПКМ - круг)"
            />
             <IconButton
              icon={<FiRefreshCw size={16} />}
              onClick={() => onMirrorSelected("x")}
              title="Отразить"
            />
            <IconButton
              icon={<FiLayers size={16} />}
              disabled={!canGroupSelected}
              onClick={onGroupSelected}
              title="Группировать"
            />
            <IconButton
              icon={<FiX size={16} />}
              disabled={!canUngroupSelected}
              onClick={onUngroupSelected}
              title="Разгруппировать"
            />
            <IconButton
              icon={<FiTrash2 size={16} />}
              variant="danger"
              onClick={onDeleteSelected}
              title="Удалить"
            />
          </div>
        </>
      )}

      {hasDraft && (
        <>
          <div className="h-px bg-border mx-1" />
          <div className="flex flex-col gap-1">
            <IconButton
              icon={<FiCheck size={16} />}
              variant="success"
              onClick={onCommitPolyline}
              title="Применить"
            />
            <IconButton
              icon={<FiX size={16} />}
              variant="danger"
              onClick={onCancelDraft}
              title="Отмена"
            />
          </div>
        </>
      )}
    </div>
  );
}
