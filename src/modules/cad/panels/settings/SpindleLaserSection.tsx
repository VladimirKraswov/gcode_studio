// src/modules/cad/panels/settings/SpindleLaserSection.tsx
import type { SketchDocument } from "../../model/types";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

type SpindleLaserSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function SpindleLaserSection({
  document,
  setDocument,
}: SpindleLaserSectionProps) {
  return (
    <CollapsibleCardBlock title="Шпиндель / лазер / охлаждение">
      <div className="grid min-w-0 grid-cols-2 gap-2.5">
        <label className="ui-label">
          Spindle speed (S)
          <input
            className="ui-input"
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

        <label className="ui-label">
          Направление
          <select
            value={document.spindleDirection}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                spindleDirection: e.target.value as SketchDocument["spindleDirection"],
              }))
            }
            className="ui-input"
          >
            <option value="cw">CW (M3)</option>
            <option value="ccw">CCW (M4)</option>
          </select>
        </label>

        <label className="ui-label">
          S power
          <input
            className="ui-input"
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

        <label className="ui-label">
          Dwell, мс
          <input
            className="ui-input"
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

      <div className="mt-2.5 grid gap-2.5">
        <label className="ui-check-row">
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

        <label className="ui-check-row">
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

        <label className="ui-check-row">
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
    </CollapsibleCardBlock>
  );
}