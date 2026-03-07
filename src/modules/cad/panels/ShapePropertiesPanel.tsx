import { FiBox, FiCircle, FiEdit3, FiMove, FiType } from "react-icons/fi";
import { clamp } from "../../../utils";
import { theme, ui } from "../../../styles/ui";
import type { SketchDocument, SketchShape } from "../model/types";
import { updateShape } from "../model/document";
import { DEFAULT_FONT_OPTIONS } from "../editor-state/textToolState";

type ShapePropertiesPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selectedShape: SketchShape;
};

function CardBlock({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", border: `1px solid ${theme.border}`, borderRadius: 14, padding: 12, minWidth: 0 }}>{children}</div>;
}

const twoColumnGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, minWidth: 0 };
const fieldLabel: React.CSSProperties = { ...ui.inputLabel };
const checkboxRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 700, color: theme.text, padding: 12, borderRadius: 12, background: "#fff", border: `1px solid ${theme.border}` };

function getShapeIcon(type: SketchShape["type"]) {
  switch (type) {
    case "rectangle": return <FiBox size={18} />;
    case "circle": return <FiCircle size={18} />;
    case "polyline": return <FiMove size={18} />;
    case "text": return <FiType size={18} />;
    default: return <FiEdit3 size={18} />;
  }
}

export function ShapePropertiesPanel({ document, setDocument, selectedShape }: ShapePropertiesPanelProps) {
  function updateSelected(patch: Record<string, number | string | boolean | null>) {
    setDocument((prev) => updateShape(prev, selectedShape.id, patch as Partial<SketchShape>));
  }

  return (
    <>
      <div style={{ height: 1, background: theme.border, margin: "18px 0" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={ui.iconBadge}>{getShapeIcon(selectedShape.type)}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>Выбранный объект</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Тип: {selectedShape.type}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <CardBlock><label style={fieldLabel}>Имя<input style={ui.input} type="text" value={selectedShape.name} onChange={(e) => updateSelected({ name: e.target.value })} /></label></CardBlock>
        <CardBlock><label style={fieldLabel}>Индивидуальная глубина Z<input style={ui.input} type="number" value={selectedShape.cutZ ?? document.cutZ} onChange={(e) => updateSelected({ cutZ: Number(e.target.value) || 0 })} /></label></CardBlock>

        {selectedShape.type === "rectangle" && (
          <CardBlock><div style={twoColumnGrid}>
            <label style={fieldLabel}>X<input style={ui.input} type="number" value={selectedShape.x} onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })} /></label>
            <label style={fieldLabel}>Y<input style={ui.input} type="number" value={selectedShape.y} onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })} /></label>
            <label style={fieldLabel}>Width<input style={ui.input} type="number" value={selectedShape.width} onChange={(e) => updateSelected({ width: clamp(Number(e.target.value) || 1, 1, 100000) })} /></label>
            <label style={fieldLabel}>Height<input style={ui.input} type="number" value={selectedShape.height} onChange={(e) => updateSelected({ height: clamp(Number(e.target.value) || 1, 1, 100000) })} /></label>
          </div></CardBlock>
        )}

        {selectedShape.type === "circle" && (
          <CardBlock><div style={twoColumnGrid}>
            <label style={fieldLabel}>CX<input style={ui.input} type="number" value={selectedShape.cx} onChange={(e) => updateSelected({ cx: Number(e.target.value) || 0 })} /></label>
            <label style={fieldLabel}>CY<input style={ui.input} type="number" value={selectedShape.cy} onChange={(e) => updateSelected({ cy: Number(e.target.value) || 0 })} /></label>
            <label style={fieldLabel}>Radius<input style={ui.input} type="number" value={selectedShape.radius} onChange={(e) => updateSelected({ radius: clamp(Number(e.target.value) || 1, 1, 100000) })} /></label>
          </div></CardBlock>
        )}

        {selectedShape.type === "polyline" && (
          <label style={checkboxRow}><input type="checkbox" checked={selectedShape.closed} onChange={(e) => updateSelected({ closed: e.target.checked })} /><span>Замкнуть полилинию</span></label>
        )}

        {selectedShape.type === "text" && (
          <>
            <CardBlock><label style={fieldLabel}>Текст<input style={ui.input} type="text" value={selectedShape.text} onChange={(e) => updateSelected({ text: e.target.value })} /></label></CardBlock>
            <CardBlock><div style={twoColumnGrid}>
              <label style={fieldLabel}>X<input style={ui.input} type="number" value={selectedShape.x} onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })} /></label>
              <label style={fieldLabel}>Y<input style={ui.input} type="number" value={selectedShape.y} onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })} /></label>
              <label style={fieldLabel}>Height<input style={ui.input} type="number" value={selectedShape.height} onChange={(e) => updateSelected({ height: clamp(Number(e.target.value) || 2, 2, 100000) })} /></label>
              <label style={fieldLabel}>Letter spacing<input style={ui.input} type="number" step="0.5" value={selectedShape.letterSpacing} onChange={(e) => updateSelected({ letterSpacing: Math.max(0, Number(e.target.value) || 0) })} /></label>
            </div></CardBlock>
            <CardBlock><div style={twoColumnGrid}>
              <label style={fieldLabel}>Font<select value={selectedShape.fontFile} onChange={(e) => updateSelected({ fontFile: e.target.value })} style={ui.select}>{DEFAULT_FONT_OPTIONS.map((font) => <option key={font} value={font}>{font.split("/").pop()}</option>)}</select></label>
              <label style={fieldLabel}>Rotation<input style={ui.input} type="number" value={selectedShape.rotation ?? 0} onChange={(e) => updateSelected({ rotation: Number(e.target.value) || 0 })} /></label>
              <label style={{ ...fieldLabel, gridColumn: "1 / -1" }}>Align<select value={selectedShape.align ?? "left"} onChange={(e) => updateSelected({ align: e.target.value })} style={ui.select}><option value="left">left</option><option value="center">center</option><option value="right">right</option></select></label>
            </div></CardBlock>
          </>
        )}
      </div>
    </>
  );
}
