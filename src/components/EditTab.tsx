// src/components/EditTab.tsx
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
} from "../modules/cad";
import type { CadPanButtonMode } from "../utils/settings";
import { ui } from "../styles/ui";

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

export function EditTab(props: EditTabProps) {
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

  const primaryShape = props.document.shapes.find((shape) => shape.id === props.selection.primaryId) ?? null;
  const canGroupSelected = props.selection.ids.length > 1;
  const canUngroupSelected = Boolean(primaryShape?.groupId);
  const hasDraft = Boolean(editor.draft) || editor.polylineDraft.length > 0;

  return (
    <>
      <div style={{ ...ui.panel, padding: 16, height: "100%", minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", width: "100%" }}>
        <EditToolbar
          tool={editor.tool}
          onToolChange={editor.setTool}
          onStartLinearArray={editor.startLinearArray}
          onStartCircularArray={editor.startCircularArray}
          onCommitPolyline={editor.commitPolyline}
          onCancelDraft={editor.cancelCurrentDraft}
          onDeleteSelected={editor.deleteSelected}
          onResetView={editor.resetView}
          onGenerate={editor.handleGenerateClick}
          isGenerating={editor.isGenerating}
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

        {editor.arrayTool.mode && (
          <ArrayToolPanel
            mode={editor.arrayTool.mode}
            linear={editor.arrayTool.linear}
            circular={editor.arrayTool.circular}
            onLinearChange={editor.updateLinearArrayParams}
            onCircularChange={editor.updateCircularArrayParams}
            onApply={editor.applyArray}
            onClose={editor.closeArrayTool}
          />
        )}

        {editor.tool === "text" && (
          <TextToolPanel
            value={editor.textTool}
            fontOptions={editor.fontOptions}
            onChange={(patch) => editor.setTextTool((prev) => ({ ...prev, ...patch }))}
          />
        )}

        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", gap: 12, overflow: "hidden" }}>
          <div style={{ ...ui.panelInset, flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden", background: "#f8fafc", display: "flex" }}>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden" }}>
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
                constraintDraft={editor.constraintDraft}
                arrayPreviewShapes={editor.arrayPreviewShapes}
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
                onConstraintEdgeHandlePointerDown={editor.bindConstraintEdgeHandleStart}
                onConstraintLabelPointerDown={editor.bindConstraintLabelDragStart}
                isTransforming={editor.isTransforming}
              />
            </div>
          </div>
        </div>

        <EditStatusBar
          objectCount={props.document.shapes.length}
          tool={editor.tool}
          isDragging={editor.isDragging}
          isPanning={editor.isPanning}
          isTransforming={editor.isTransforming}
          hasDraft={hasDraft}
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
    </>
  );
}