import type { TextToolState } from "../editor-state/textToolState";
import type { SketchDocument } from "../model/types";
import type { SelectionState } from "../model/selection";

export type TextToolPanelProps = {
  document?: SketchDocument;
  selection?: SelectionState;
  onSelectionChange?: (next: SelectionState) => void;
  setDocument?: React.Dispatch<React.SetStateAction<SketchDocument>>;

  value?: TextToolState;
  fontOptions?: string[];
  onChange?: (patch: Partial<TextToolState>) => void;
};

export function TextToolPanel({
  value = { text: "GCode", height: 10, letterSpacing: 0, fontFile: "Roboto" },
  onChange = () => {},
}: TextToolPanelProps) {
  return (
    <div className="ui-panel-inset mb-3 grid shrink-0 gap-2.5 p-3">
      <label className="ui-label">
        Текст
        <input
          type="text"
          value={value.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="ui-input"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="ui-label">
          Высота
          <input
            type="number"
            min="2"
            value={value.height}
            onChange={(e) => onChange({ height: Math.max(2, Number(e.target.value)) })}
            className="ui-input"
          />
        </label>

        <label className="ui-label">
          Интервал
          <input
            type="number"
            min="0"
            value={value.letterSpacing}
            onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
            className="ui-input"
          />
        </label>
      </div>
    </div>
  );
}
