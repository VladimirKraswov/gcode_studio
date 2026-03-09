// src/containers/RightPanelContainer.tsx
import { useApp } from '../contexts/AppContext';
import { RightInfoPanel } from '../components/RightInfoPanel';
import { GCodeRightPanel } from '../components/GCodeRightPanel';
import { EditRightPanel } from '../components/EditRightPanel';

export function RightPanelContainer() {
  const {
    activeTab,
    parsed,
    stock,
    currentState,
    cameraInfo,
    editDocument,
    setEditDocument,
    selection,
    settings,
    updateSettings,
  } = useApp();

  if (activeTab === "view") {
    return (
      <RightInfoPanel
        bounds={parsed?.bounds ?? { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 }}
        stock={stock}
        parsedStats={parsed?.stats ?? { totalLines: 0, totalMoves: 0, rapidMoves: 0, workMoves: 0, cuttingMoves: 0, renderMoves: 0, renderStep: 0 }}
        currentState={currentState}
        cameraInfo={cameraInfo}
        totalLength={parsed?.totalLength ?? 0}
      />
    );
  }

  if (activeTab === "gcode") {
    return (
      <GCodeRightPanel
        stats={parsed?.stats ?? { totalLines: 0, totalMoves: 0, rapidMoves: 0, workMoves: 0, cuttingMoves: 0, renderMoves: 0, renderStep: 0 }}
        totalLength={parsed?.totalLength ?? 0}
      />
    );
  }

  return (
    <EditRightPanel
      document={editDocument}
      setDocument={setEditDocument}
      selection={selection}
      panButtonMode={settings.cad.panButton}
      onPanButtonModeChange={(value) =>
        updateSettings((prev) => ({
          ...prev,
          cad: { ...prev.cad, panButton: value },
        }))
      }
    />
  );
}