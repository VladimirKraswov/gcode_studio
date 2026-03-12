import { useEffect, useMemo } from "react";
import { SvgImportModal } from "./SvgImportModal";
import {
  CadCanvas,
  useCadEditor,
  EditStatusBar,
  EditToolbar,
  ArrayToolPanel,
  TextToolPanel,
  type SketchDocument,
  type SelectionState,
  type ViewTransform,
  createDefaultCadRegistry,
  CadRegistryProvider,
  QuickConstraintBar,
} from "@/features/cad-editor";
import type { CadPanButtonMode } from "@/shared/utils/settings";
import { FiPlay } from "react-icons/fi";
import { useCad } from "@/contexts/CadContext";
import { Draggable } from "@/shared/components/ui/Draggable";

type EditTabProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  setDocumentSilently: React.Dispatch<React.SetStateAction<SketchDocument>>;
  onGenerateGCode: (gcode: string) => void;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
  onSelectionChangeSilently: (selection: SelectionState) => void;
  view: ViewTransform;
  onViewChange: React.Dispatch<React.SetStateAction<ViewTransform>>;
  onViewChangeSilently: React.Dispatch<React.SetStateAction<ViewTransform>>;
  checkpointHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  panButtonMode: CadPanButtonMode;
};

export default function EditTab(props: EditTabProps) {
  const { setCadEditor } = useCad();
  const cadRegistry = useMemo(() => createDefaultCadRegistry(), []);

  const editor = useCadEditor({
    document: props.document,
    setDocument: props.setDocument,
    setDocumentSilently: props.setDocumentSilently,
    onGenerateGCode: props.onGenerateGCode,
    selection: props.selection,
    onSelectionChange: props.onSelectionChange,
    onSelectionChangeSilently: props.onSelectionChangeSilently,
    view: props.view,
    onViewChange: props.onViewChange,
    onViewChangeSilently: props.onViewChangeSilently,
    checkpointHistory: props.checkpointHistory,
    panButtonMode: props.panButtonMode,
  });

  const primaryShape =
    props.document.shapes.find((shape) => shape.id === props.selection.primaryId) ?? null;
  const canGroupSelected = props.selection.ids.length > 1;
  const canUngroupSelected = Boolean(primaryShape?.groupId);
  const hasDraft = Boolean(editor.draft) || editor.polylineDraft.length > 0;

  // Synchronize editor methods with context
  useEffect(() => {
    setCadEditor({
      insertControlPointToSelectedBSpline: editor.insertControlPointToSelectedBSpline,
      removeSelectedPointFromBSpline: editor.removeSelectedPointFromBSpline,
    });

    return () => {
      setCadEditor(null);
    };
  }, [
    editor.insertControlPointToSelectedBSpline,
    editor.removeSelectedPointFromBSpline,
    setCadEditor
  ]);

  return (
    <CadRegistryProvider registry={cadRegistry}>
      <div className="flex flex-1 flex-col overflow-hidden bg-bg relative">
        {/* Workspace Area */}
        <div className="flex-1 relative flex overflow-hidden">

          {/* Left Vertical Tools */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30">
            <EditToolbar
              tool={editor.tool}
              onToolChange={editor.setTool}
              onStartLinearArray={editor.startLinearArray}
              onStartCircularArray={editor.startCircularArray}
              onCommitPolyline={editor.commitPolyline}
              onCancelDraft={editor.cancelCurrentDraft}
              onDeleteSelected={editor.deleteSelected}
              onResetView={editor.resetView}
              onUndo={props.onUndo}
              onRedo={props.onRedo}
              canUndo={props.canUndo}
              canRedo={props.canRedo}
              onImportSvg={editor.startSvgImport}
              onGroupSelected={editor.groupSelected}
              onUngroupSelected={editor.ungroupSelected}
              onCloneSelected={editor.cloneSelected}
              onMirrorSelected={editor.mirrorSelected}
              canGroupSelected={canGroupSelected}
              canUngroupSelected={canUngroupSelected}
              hasSelection={props.selection.ids.length > 0}
              hasDraft={hasDraft}
            />
          </div>

          {/* Floating Tool Parameters (Array, Text) */}
          <div className="absolute left-16 top-4 z-30 flex flex-col gap-2 pointer-events-none">
            {editor.arrayTool.mode && (
              <Draggable className="pointer-events-auto shadow-2xl rounded-xl" handleClassName="drag-handle">
                <ArrayToolPanel
                  mode={editor.arrayTool.mode}
                  linear={editor.arrayTool.linear}
                  circular={editor.arrayTool.circular}
                  onLinearChange={editor.updateLinearArrayParams}
                  onCircularChange={editor.updateCircularArrayParams}
                  onApply={editor.applyArray}
                  onClose={editor.closeArrayTool}
                />
              </Draggable>
            )}

            {editor.tool === "text" && (
              <Draggable className="pointer-events-auto shadow-2xl rounded-xl" handleClassName="drag-handle">
                <div className="bg-panel border border-border overflow-hidden rounded-xl">
                  <div className="bg-panel-muted p-2 flex items-center justify-between border-b border-border cursor-move drag-handle">
                    <span className="font-bold text-xs px-1">Text Settings</span>
                  </div>
                  <div className="p-1">
                    <TextToolPanel
                        value={editor.textTool}
                        fontOptions={editor.fontOptions}
                        onChange={(patch) => editor.setTextTool((prev) => ({ ...prev, ...patch }))}
                    />
                  </div>
                </div>
              </Draggable>
            )}
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 min-h-0 min-w-0 bg-[#fcf8f3] dark:bg-[#1c1917]">
            <CadCanvas
              svgRef={editor.svgRef}
              document={props.document}
              selection={props.selection}
              view={editor.view}
              draft={editor.draft}
              polylineDraft={editor.polylineDraft}
              polylineHoverPoint={editor.polylineHoverPoint}
              textPreviewMap={editor.textPreviewMap}
              tool={editor.tool}
              isDragging={editor.isDragging}
              isPanning={editor.isPanning}
              isSelectionHover={editor.isSelectionHover}
              arrayPreview={editor.arrayPreview}
              onSelectionHoverChange={editor.setIsSelectionHover}
              onPointerDown={editor.handleCanvasPointerDown}
              onPointerMove={editor.handleCanvasPointerMove}
              onPointerUp={editor.handleCanvasPointerUp}
              onPointerLeave={editor.handleCanvasPointerLeave}
              onDoubleClick={editor.handleCanvasDoubleClick}
              onWheel={editor.handleCanvasWheel}
              onContextMenu={editor.handleCanvasContextMenu}
              onShapePointerDown={editor.bindSelectStart}
              onSelectionPointerDown={editor.bindSelectionDragStart}
              onScaleHandlePointerDown={editor.bindScaleHandleStart}
              onRotateHandlePointerDown={editor.bindRotateHandleStart}
              onConstraintPointerDown={editor.onConstraintPointerDown}
              onConstraintValueChange={editor.updateConstraintValue}
              onConstraintDelete={editor.deleteConstraintById}
              onSplitLine={editor.splitLine}
              onMergePoints={editor.mergePoints}
              isTransforming={editor.isTransforming}
            />
          </div>

          {/* Quick Constraints Bar */}
          {props.selection.ids.length > 0 && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-12 z-20">
              <QuickConstraintBar onAdd={editor.addQuickConstraint} />
            </div>
          )}

          {/* Quick Generate Button */}
          <button
            onClick={editor.handleGenerateClick}
            disabled={editor.isGenerating}
            className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 z-20"
            title="Сгенерировать G-code"
          >
             <FiPlay size={20} className={editor.isGenerating ? "animate-pulse" : ""} />
          </button>
        </div>

        {/* CAD Footer */}
        <div className="h-8 shrink-0 border-t border-border bg-panel-solid">
          <EditStatusBar
            objectCount={props.document.shapes.length}
            tool={editor.tool}
            isDragging={editor.isDragging}
            isPanning={editor.isPanning}
            isTransforming={editor.isTransforming}
            hasDraft={hasDraft}
            dof={editor.dof}
          />
        </div>

        <SvgImportModal
          open={editor.svgImport.open}
          fileName={editor.svgImport.fileName}
          stage={editor.svgImport.stage}
          progress={editor.svgImport.progress}
          message={editor.svgImport.message}
          error={editor.svgImport.error}
          draft={editor.svgImport.draft}
          onClose={editor.closeSvgImport}
          onAbort={editor.abortSvgImport}
          onChangeDraft={editor.updateSvgImportDraft}
          onConfirm={editor.confirmSvgImport}
        />
      </div>
    </CadRegistryProvider>
  );
}
