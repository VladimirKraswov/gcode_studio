import type { TextToolState } from "../editor-state/textToolState";

type TextToolPanelProps = {
  value: TextToolState;
  fontOptions: string[];
  onChange: (patch: Partial<TextToolState>) => void;
};

export function TextToolPanel({
  value,
  fontOptions,
  onChange,
}: TextToolPanelProps) {
  return (
    <div className="ui-panel-inset mb-3 grid shrink-0 grid-cols-[minmax(0,1fr)_120px_120px] gap-2.5 p-3">
      <label className="ui-label">
        Текст
        <input
          type="text"
          value={value.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="ui-input"
        />
      </label>

      <label className="ui-label">
        Высота
        <input
          type="number"
          min="2"
          value={value.height}
          onChange={(e) =>
            onChange({ height: Math.max(2, Number(e.target.value) || 2) })
          }
          className="ui-input"
        />
      </label>

      <label className="ui-label">
        Интервал
        <input
          type="number"
          min="0"
          step="0.5"
          value={value.letterSpacing}
          onChange={(e) =>
            onChange({
              letterSpacing: Math.max(0, Number(e.target.value) || 0),
            })
          }
          className="ui-input"
        />
      </label>

      <label className="ui-label col-span-full">
        Шрифт
        <select
          value={value.fontFile}
          onChange={(e) => onChange({ fontFile: e.target.value })}
          className="ui-input"
        >
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