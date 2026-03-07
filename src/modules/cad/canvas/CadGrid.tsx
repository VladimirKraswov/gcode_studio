import type { SketchDocument } from "../model/types";
import type { ViewTransform } from "../model/view";

type CadGridProps = {
  document: SketchDocument;
  view: ViewTransform;
};

export function CadGrid({ document, view }: CadGridProps) {
  const baseStep = Math.max(1, document.snapStep || 1);
  const minorStep = baseStep * view.scale;
  const majorStep = minorStep * 5;

  const width = document.width * view.scale;
  const height = document.height * view.scale;

  return (
    <>
      <defs>
        <pattern
          id="cad-grid-minor"
          width={minorStep}
          height={minorStep}
          patternUnits="userSpaceOnUse"
          x={view.offsetX}
          y={view.offsetY}
        >
          <path
            d={`M ${minorStep} 0 L 0 0 0 ${minorStep}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        </pattern>

        <pattern
          id="cad-grid-major"
          width={majorStep}
          height={majorStep}
          patternUnits="userSpaceOnUse"
          x={view.offsetX}
          y={view.offsetY}
        >
          <rect width={majorStep} height={majorStep} fill="url(#cad-grid-minor)" />
          <path
            d={`M ${majorStep} 0 L 0 0 0 ${majorStep}`}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />
        </pattern>
      </defs>

      <rect
        x={view.offsetX}
        y={view.offsetY}
        width={width}
        height={height}
        fill="url(#cad-grid-major)"
      />
    </>
  );
}