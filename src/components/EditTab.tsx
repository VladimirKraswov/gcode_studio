import { SvgImportModal } from "./SvgImportModal";
import { CadCanvas } from "../modules/cad/canvas/CadCanvas";
import { useCadEditor } from "../modules/cad/hooks/useCadEditor";
import { EditStatusBar } from "../modules/cad/panels/EditStatusBar";
import { EditToolbar } from "../modules/cad/panels/EditToolbar";
import { TextToolPanel } from "../modules/cad/panels/TextToolPanel";
import type { SketchDocument } from "../modules/cad/model/types";
import type { SelectionState } from "../modules/cad/model/selection";
import type { ViewTransform } from "../modules/cad/model/view";
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

export function EditTab({
  document,
  setDocument,
  setDocumentSilently,
  onGenerateGCode,
  selection,
  onSelectionChange,
  onSelectionChangeSilently,
  view,
  onViewChange,
  onViewChangeSilently,
  checkpointHistory,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  panButtonMode,
}: EditTabProps) {

  const editor = useCadEditor({
    document,
    setDocument,
    setDocumentSilently,
    onGenerateGCode,
    selection,
    onSelectionChange,
    onSelectionChangeSilently,
    view,
    onViewChange,
    onViewChangeSilently,
    checkpointHistory,
    panButtonMode,
  });

  return (
    <>
      <div
        style={{
          ...ui.panel,
          padding: 16,
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <EditToolbar
          tool={editor.tool}
          onToolChange={editor.setTool}
          onCommitPolyline={editor.commitPolyline}
          onDeleteSelected={editor.deleteSelected}
          onResetView={editor.resetView}
          onGenerate={editor.handleGenerateClick}
          isGenerating={editor.isGenerating}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onImportSvg={editor.startSvgImport}
          onGroupSelected={editor.groupSelected}
          onUngroupSelected={editor.ungroupSelected}
        />

        {editor.tool === "text" && (
          <TextToolPanel
            value={editor.textTool}
            fontOptions={editor.fontOptions}
            onChange={(patch) =>
              editor.setTextTool((prev) => ({
                ...prev,
                ...patch,
              }))
            }
          />
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: "flex",
            gap: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              ...ui.panelInset,
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
              background: "#f8fafc",
              display: "flex",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <CadCanvas
                svgRef={editor.svgRef}
                document={document}
                selection={selection}
                view={editor.view}
                draft={editor.draft}
                polylineDraft={editor.polylineDraft}
                textPreviewMap={editor.textPreviewMap}
                tool={editor.tool}
                onPointerDown={editor.handleCanvasPointerDown}
                onPointerMove={editor.handleCanvasPointerMove}
                onPointerUp={editor.handleCanvasPointerUp}
                onPointerLeave={editor.handleCanvasPointerUp}
                onWheel={editor.handleCanvasWheel}
                onShapePointerDown={editor.bindSelectStart}
                onSelectionPointerDown={editor.bindSelectionDragStart}
              />
            </div>
          </div>
        </div>

        <EditStatusBar objectCount={document.shapes.length} />
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