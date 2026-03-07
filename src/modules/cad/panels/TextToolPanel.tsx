import { ui } from "../../../styles/ui";
import type { TextToolState } from "../editor-state/textToolState";

type TextToolPanelProps = {
  value: TextToolState;
  fontOptions: string[];
  onChange: (patch: Partial<TextToolState>) => void;
};

const miniLabel: React.CSSProperties = {
  ...ui.inputLabel,
};

export function TextToolPanel({ value, fontOptions, onChange }: TextToolPanelProps) {
  return (
    <div
      style={{
        ...ui.panelInset,
        padding: 12,
        marginBottom: 12,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 120px 120px",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <label style={miniLabel}>
        Текст
        <input type="text" value={value.text} onChange={(e) => onChange({ text: e.target.value })} style={ui.input} />
      </label>

      <label style={miniLabel}>
        Высота
        <input
          type="number"
          min="2"
          value={value.height}
          onChange={(e) => onChange({ height: Math.max(2, Number(e.target.value) || 2) })}
          style={ui.input}
        />
      </label>

      <label style={miniLabel}>
        Интервал
        <input
          type="number"
          min="0"
          step="0.5"
          value={value.letterSpacing}
          onChange={(e) => onChange({ letterSpacing: Math.max(0, Number(e.target.value) || 0) })}
          style={ui.input}
        />
      </label>

      <label style={{ ...miniLabel, gridColumn: "1 / -1" }}>
        Шрифт
        <select value={value.fontFile} onChange={(e) => onChange({ fontFile: e.target.value })} style={ui.select}>
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font.split("/").pop()}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
