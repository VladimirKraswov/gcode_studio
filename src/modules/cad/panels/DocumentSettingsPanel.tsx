import { ui } from "../../../styles/ui";
import type { SketchDocument } from "../model/types";

type DocumentSettingsPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

const fieldLabel: React.CSSProperties = {
  ...ui.inputLabel,
};

const checkboxRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
  padding: 12,
  borderRadius: 12,
  background: "#fff",
  border: "1px solid #dbe4ee",
};

function CardBlock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #dbe4ee", borderRadius: 14, padding: 12, minWidth: 0 }}>
      {children}
    </div>
  );
}

export function DocumentSettingsPanel({ document, setDocument }: DocumentSettingsPanelProps) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <CardBlock>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={fieldLabel}>
            Шаг сетки
            <input
              style={ui.input}
              type="number"
              min="1"
              value={document.snapStep}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  snapStep: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={document.snapEnabled}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  snapEnabled: e.target.checked,
                }))
              }
            />
            <span>Привязка к сетке</span>
          </label>
        </div>
      </CardBlock>

      <CardBlock>
        <div style={twoColumnGrid}>
          <label style={fieldLabel}>Ширина листа<input style={ui.input} type="number" value={document.width} onChange={(e) => setDocument((prev) => ({ ...prev, width: Math.max(1, Number(e.target.value) || 1) }))} /></label>
          <label style={fieldLabel}>Высота листа<input style={ui.input} type="number" value={document.height} onChange={(e) => setDocument((prev) => ({ ...prev, height: Math.max(1, Number(e.target.value) || 1) }))} /></label>
        </div>
      </CardBlock>

      <CardBlock>
        <div style={twoColumnGrid}>
          <label style={fieldLabel}>Safe Z<input style={ui.input} type="number" value={document.safeZ} onChange={(e) => setDocument((prev) => ({ ...prev, safeZ: Number(e.target.value) || 0 }))} /></label>
          <label style={fieldLabel}>Cut Z по умолчанию<input style={ui.input} type="number" value={document.cutZ} onChange={(e) => setDocument((prev) => ({ ...prev, cutZ: Number(e.target.value) || 0 }))} /></label>
        </div>
      </CardBlock>

      <CardBlock>
        <div style={twoColumnGrid}>
          <label style={fieldLabel}>Feed cut<input style={ui.input} type="number" value={document.feedCut} onChange={(e) => setDocument((prev) => ({ ...prev, feedCut: Math.max(1, Number(e.target.value) || 1) }))} /></label>
          <label style={fieldLabel}>Feed rapid<input style={ui.input} type="number" value={document.feedRapid} onChange={(e) => setDocument((prev) => ({ ...prev, feedRapid: Math.max(1, Number(e.target.value) || 1) }))} /></label>
        </div>
      </CardBlock>

      <label style={checkboxRow}>
        <input type="checkbox" checked={document.spindleOn} onChange={(e) => setDocument((prev) => ({ ...prev, spindleOn: e.target.checked }))} />
        <span>Лазер / spindle M3/M5</span>
      </label>

      <label style={fieldLabel}>S power<input style={ui.input} type="number" value={document.laserPower} onChange={(e) => setDocument((prev) => ({ ...prev, laserPower: Math.max(0, Number(e.target.value) || 0) }))} /></label>
    </div>
  );
}

