import { CadCanvas } from "../modules/cad/canvas/CadCanvas";
import { useCadEditor } from "../modules/cad/hooks/useCadEditor";
import { EditStatusBar } from "../modules/cad/panels/EditStatusBar";
import { EditToolbar } from "../modules/cad/panels/EditToolbar";
import { TextToolPanel } from "../modules/cad/panels/TextToolPanel";
import type { SketchDocument } from "../modules/cad/model/types";
import type { SelectionState } from "../modules/cad/model/selection";
import type { ViewTransform } from "../modules/cad/model/view";
import { ui } from "../styles/ui";

type EditTabProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  onGenerateGCode: (gcode: string) => void;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
  view: ViewTransform;
  onViewChange: React.Dispatch<React.SetStateAction<ViewTransform>>;
};

export function EditTab({
  document,
  setDocument,
  onGenerateGCode,
  selection,
  onSelectionChange,
  view,
  onViewChange,
}: EditTabProps) {
  const editor = useCadEditor({
    document,
    setDocument,
    onGenerateGCode,
    selection,
    onSelectionChange,
    view,
    onViewChange,
  });

  return (
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
          />
        </div>
      </div>

      <EditStatusBar objectCount={document.shapes.length} />
    </div>
  );
}