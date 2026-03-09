// src/hooks/useProject.ts
import { useCallback } from 'react';
import { downloadTextFile } from '../utils';
import { createProjectFile, parseProjectFile } from '../utils/projectFile';
import { DEMO_GCODE } from '../constants/demo';
import { applyDistanceConstraints } from '../modules/cad/model/constraints';
import type { ChangeEvent } from 'react';
import type { StockDimensions, PlacementMode } from '../types/gcode';
import type { MainTab } from '../types/ui';
import type { SketchDocument } from '../modules/cad/model/types';
import type { SelectionState } from '../modules/cad/model/selection';
import type { ViewTransform } from '../modules/cad/model/view';

export function useProject(
  // Setters
  setSource: (src: string) => void,
  setFileName: (name: string) => void,
  setStock: (stock: StockDimensions) => void,
  setShowMaterialRemoval: (value: boolean) => void,
  setPlacementMode: (mode: PlacementMode) => void,
  setDetailLevel: (level: number) => void,
  setActiveTab: (tab: MainTab) => void,
  setEditDocument: (doc: SketchDocument | ((prev: SketchDocument) => SketchDocument)) => void,
  setSelection: (sel: SelectionState) => void,
  setCadView: (view: ViewTransform) => void,
  resetPlayback: () => void,
  setCameraResetKey: React.Dispatch<React.SetStateAction<number>>,
  // Current values (for saveProject)
  fileName: string,
  source: string,
  stock: StockDimensions,
  showMaterialRemoval: boolean,
  placementMode: PlacementMode,
  detailLevel: number,
  activeTab: MainTab,
  editDocument: SketchDocument,
  selection: SelectionState,
  cadView: ViewTransform
) {
  const saveProject = useCallback(() => {
    const project = {
      version: 3 as const,
      kind: "gcode-studio-project" as const,
      fileName,
      source,
      stock,
      showMaterialRemoval,
      placementMode,
      detailLevel,
      activeTab,
      editDocument,
      selection,
      cadView,
    };
    const outputName = fileName.replace(/\.(gcode|nc|tap|txt|gs)$/i, "") + ".gs";
    downloadTextFile(createProjectFile(project), outputName);
  }, [fileName, source, stock, showMaterialRemoval, placementMode, detailLevel, activeTab, editDocument, selection, cadView]);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setSource(text || "");
    setFileName(file.name || "loaded.gcode");
    resetPlayback();
    setCameraResetKey((v) => v + 1);
  }, [setSource, setFileName, resetPlayback, setCameraResetKey]);

  const handleProjectFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const project = parseProjectFile(text);

      setFileName(project.fileName || "project.gcode");
      setSource(project.source || "");
      setStock(project.stock);
      setShowMaterialRemoval(project.showMaterialRemoval);
      setPlacementMode(project.placementMode);
      setDetailLevel(project.detailLevel);
      setActiveTab(project.activeTab);

      const constrained = applyDistanceConstraints(project.editDocument).document;
      setEditDocument(constrained);
      setSelection(project.selection);
      setCadView(project.cadView);

      resetPlayback();
      setCameraResetKey((v) => v + 1);
    } catch (error) {
      console.error(error);
      alert("Не удалось загрузить файл проекта .gs");
    } finally {
      event.target.value = "";
    }
  }, [setFileName, setSource, setStock, setShowMaterialRemoval, setPlacementMode, setDetailLevel, setActiveTab, setEditDocument, setSelection, setCadView, resetPlayback, setCameraResetKey]);

  const loadDemo = useCallback(() => {
    setSource(DEMO_GCODE);
    setFileName("demo.gcode");
    resetPlayback();
    setCameraResetKey((v) => v + 1);
  }, [setSource, setFileName, resetPlayback, setCameraResetKey]);

  return { saveProject, handleFileChange, handleProjectFileChange, loadDemo };
}