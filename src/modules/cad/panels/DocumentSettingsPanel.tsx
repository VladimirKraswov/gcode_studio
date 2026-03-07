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

const threeColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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

function CardBlock({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #dbe4ee",
        borderRadius: 14,
        padding: 12,
        minWidth: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 10,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function DocumentSettingsPanel({
  document,
  setDocument,
}: DocumentSettingsPanelProps) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <CardBlock title="Сетка и лист">
        <div style={{ display: "grid", gap: 10 }}>
          <div style={twoColumnGrid}>
            <label style={fieldLabel}>
              Ширина листа
              <input
                style={ui.input}
                type="number"
                min="1"
                value={document.width}
                onChange={(e) =>
                  setDocument((prev) => ({
                    ...prev,
                    width: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
              />
            </label>

            <label style={fieldLabel}>
              Высота листа
              <input
                style={ui.input}
                type="number"
                min="1"
                value={document.height}
                onChange={(e) =>
                  setDocument((prev) => ({
                    ...prev,
                    height: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
              />
            </label>
          </div>

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

      <CardBlock title="Основные настройки генерации">
        <div style={twoColumnGrid}>
          <label style={fieldLabel}>
            Единицы
            <select
              value={document.units}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  units: e.target.value as SketchDocument["units"],
                }))
              }
              style={ui.select}
            >
              <option value="mm">мм (G21)</option>
              <option value="inch">дюймы (G20)</option>
            </select>
          </label>

          <label style={fieldLabel}>
            Work offset
            <select
              value={document.workOffset}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  workOffset: e.target.value as SketchDocument["workOffset"],
                }))
              }
              style={ui.select}
            >
              <option value="G54">G54</option>
              <option value="G55">G55</option>
              <option value="G56">G56</option>
              <option value="G57">G57</option>
              <option value="G58">G58</option>
              <option value="G59">G59</option>
            </select>
          </label>
        </div>
      </CardBlock>

      <CardBlock title="Оси Z и проходы">
        <div style={twoColumnGrid}>
          <label style={fieldLabel}>
            Start Z
            <input
              style={ui.input}
              type="number"
              value={document.startZ}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  startZ: Number(e.target.value) || 0,
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Safe Z
            <input
              style={ui.input}
              type="number"
              value={document.safeZ}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  safeZ: Number(e.target.value) || 0,
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Cut Z по умолчанию
            <input
              style={ui.input}
              type="number"
              value={document.cutZ}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  cutZ: Number(e.target.value) || 0,
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Pass depth
            <input
              style={ui.input}
              type="number"
              min="0.001"
              step="0.001"
              value={document.passDepth}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  passDepth: Math.max(0.001, Number(e.target.value) || 0.001),
                }))
              }
            />
          </label>
        </div>
      </CardBlock>

      <CardBlock title="Подачи">
        <div style={threeColumnGrid}>
          <label style={fieldLabel}>
            Feed cut
            <input
              style={ui.input}
              type="number"
              min="1"
              value={document.feedCut}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  feedCut: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Feed plunge
            <input
              style={ui.input}
              type="number"
              min="1"
              value={document.feedPlunge}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  feedPlunge: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Feed rapid
            <input
              style={ui.input}
              type="number"
              min="1"
              value={document.feedRapid}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  feedRapid: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>
        </div>
      </CardBlock>

      <CardBlock title="Инструмент">
        <div style={threeColumnGrid}>
          <label style={fieldLabel}>
            Тип инструмента
            <select
              value={document.toolType}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  toolType: e.target.value as SketchDocument["toolType"],
                  spindleOn: e.target.value === "laser" ? true : prev.spindleOn,
                }))
              }
              style={ui.select}
            >
              <option value="router">Router</option>
              <option value="spindle">Spindle</option>
              <option value="laser">Laser</option>
              <option value="drag-knife">Drag knife</option>
            </select>
          </label>

          <label style={fieldLabel}>
            Tool number
            <input
              style={ui.input}
              type="number"
              min="1"
              value={document.toolNumber}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  toolNumber: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Диаметр инструмента
            <input
              style={ui.input}
              type="number"
              min="0"
              step="0.001"
              value={document.toolDiameter}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  toolDiameter: Math.max(0.001, Number(e.target.value) || 0.001),
                }))
              }
            />
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={fieldLabel}>
            Stepover (0..1)
            <input
              style={ui.input}
              type="number"
              min="0.05"
              max="1"
              step="0.01"
              value={document.stepover}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  stepover: Math.min(1, Math.max(0.05, Number(e.target.value) || 0.45)),
                }))
              }
            />
          </label>
        </div>
      </CardBlock>

      <CardBlock title="Шпиндель / лазер / охлаждение">
        <div style={twoColumnGrid}>
          <label style={fieldLabel}>
            Spindle speed (S)
            <input
              style={ui.input}
              type="number"
              min="0"
              value={document.spindleSpeed}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  spindleSpeed: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Направление
            <select
              value={document.spindleDirection}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  spindleDirection: e.target.value as SketchDocument["spindleDirection"],
                }))
              }
              style={ui.select}
            >
              <option value="cw">CW (M3)</option>
              <option value="ccw">CCW (M4)</option>
            </select>
          </label>

          <label style={fieldLabel}>
            S power
            <input
              style={ui.input}
              type="number"
              min="0"
              value={document.laserPower}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  laserPower: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>

          <label style={fieldLabel}>
            Dwell, мс
            <input
              style={ui.input}
              type="number"
              min="0"
              value={document.dwellMs}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  dwellMs: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={document.spindleOn}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  spindleOn: e.target.checked,
                }))
              }
            />
            <span>Включать M3/M4/M5</span>
          </label>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={document.coolant}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  coolant: e.target.checked,
                }))
              }
            />
            <span>Охлаждение M8/M9</span>
          </label>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={document.returnHome}
              onChange={(e) =>
                setDocument((prev) => ({
                  ...prev,
                  returnHome: e.target.checked,
                }))
              }
            />
            <span>Возвращать в X0 Y0 в конце</span>
          </label>
        </div>
      </CardBlock>
    </div>
  );
}