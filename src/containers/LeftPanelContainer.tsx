// src/containers/LeftPanelContainer.tsx
import { LeftPanel } from '../components/LeftPanel';
import { ObjectListPanel } from '../modules/cad/panels/ObjectListPanel';
import { useApp } from '../contexts/AppContext';
import { useProject } from '../hooks/useProject';
import {
  normalizeSelectionAfterDelete,
  renameGroup,
  toggleGroupCollapsed,
  reorderShapes,
} from '../modules/cad/model/grouping';

export function LeftPanelContainer() {
  const {
    fileName,
    playing,
    progress,
    speed,
    placementMode,
    stock,
    showMaterialRemoval,
    detailLevel,
    editDocument,
    selection,
    activeTab,
    setPlaying,
    setProgress,
    setSpeed,
    setPlacementMode,
    setStock,
    setShowMaterialRemoval,
    setDetailLevel,
    setSelection,
    setEditDocument,
    setSource,
    setFileName,
    setActiveTab,
    setCadView,
    setCameraResetKey,
    resetPlayback,
  } = useApp();

  const { saveProject, handleFileChange, handleProjectFileChange, loadDemo } = useProject(
    setSource,
    setFileName,
    setStock,
    setShowMaterialRemoval,
    setPlacementMode,
    setDetailLevel,
    setActiveTab,
    setEditDocument,
    setSelection,
    setCadView,
    resetPlayback,
    setCameraResetKey,
    fileName,
    '', // source не нужен для saveProject, но можно передать, если нужно
    stock,
    showMaterialRemoval,
    placementMode,
    detailLevel,
    activeTab,
    editDocument,
    selection,
    {} as any // cadView – можно не использовать
  );

  const renameShape = (shapeId: string, name: string) => {
    setEditDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) =>
        shape.id === shapeId ? { ...shape, name } : shape
      ),
    }));
  };

  const renameGroupById = (groupId: string, name: string) => {
    setEditDocument((prev) => renameGroup(prev, groupId, name));
  };

  const toggleGroupCollapsedById = (groupId: string) => {
    setEditDocument((prev) => toggleGroupCollapsed(prev, groupId));
  };

  const toggleShapeVisibility = (shapeId: string) => {
    // checkpointHistory доступен через useApp, но здесь не нужен?
    // Для простоты оставим, но можно добавить checkpointHistory из контекста
    // const { checkpointHistory } = useApp();
    // checkpointHistory();
    setEditDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) =>
        shape.id === shapeId ? { ...shape, visible: !(shape.visible !== false) } : shape
      ),
    }));
  };

  const deleteShape = (shapeId: string) => {
    // checkpointHistory();
    setEditDocument((prev) => {
      const nextDocument = {
        ...prev,
        shapes: prev.shapes.filter((shape) => shape.id !== shapeId),
        constraints: prev.constraints.filter(
          (constraint) =>
            constraint.shapeId !== shapeId &&
            !(constraint.target.kind === "shape" && constraint.target.shapeId === shapeId)
        ),
      };
      setSelection(normalizeSelectionAfterDelete(nextDocument, selection));
      return nextDocument;
    });
  };

  const reorderDocumentShapes = (orderedIds: string[]) => {
    // checkpointHistory();
    setEditDocument((prev) => reorderShapes(prev, orderedIds));
  };

  if (activeTab === 'edit') {
    return (
      <ObjectListPanel
        document={editDocument}
        selection={selection}
        onSelectionChange={setSelection}
        onRenameShape={renameShape}
        onRenameGroup={renameGroupById}
        onToggleGroupCollapsed={toggleGroupCollapsedById}
        onToggleVisibility={toggleShapeVisibility}
        onDeleteShape={deleteShape}
        onReorderShapes={reorderDocumentShapes}
      />
    );
  }

  return (
    <LeftPanel
      mode="default"
      fileName={fileName}
      onFileChange={handleFileChange}
      onProjectFileChange={handleProjectFileChange}
      onSaveProject={saveProject}
      onLoadDemo={loadDemo}
      onResetCamera={() => setCameraResetKey((v) => v + 1)}
      playing={playing}
      onPlayPause={() => setPlaying((v) => !v)}
      onResetPlayback={resetPlayback}
      progress={progress}
      onProgressChange={setProgress}
      speed={speed}
      onSpeedChange={setSpeed}
      placementMode={placementMode}
      onPlacementModeChange={setPlacementMode}
      stock={stock}
      onStockChange={setStock}
      showMaterialRemoval={showMaterialRemoval}
      onShowMaterialRemovalChange={setShowMaterialRemoval}
      detailLevel={detailLevel}
      onDetailLevelChange={setDetailLevel}
    />
  );
}