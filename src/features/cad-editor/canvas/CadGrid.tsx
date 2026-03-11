import { useTheme } from "@/shared/hooks/useTheme";
import type { SketchDocument } from "../model/types";
import type { ViewTransform } from "../model/view";

type CadGridProps = {
  document: SketchDocument;
  view: ViewTransform;
};

function chooseMajorCadStep(baseStep: number, scale: number): number {
  const candidates = [
    baseStep,
    baseStep * 2,
    baseStep * 5,
    baseStep * 10,
    baseStep * 20,
    baseStep * 50,
    baseStep * 100,
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  for (const candidate of candidates) {
    if (candidate * scale >= 56) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1];
}

export function CadGrid({ document, view }: CadGridProps) {
  const { theme } = useTheme();

  const baseStep = Math.max(1, document.snapStep || 1);
  const minorCadStep = baseStep;
  const majorCadStep = chooseMajorCadStep(baseStep, view.scale);

  const minorStep = minorCadStep * view.scale;
  const majorStep = majorCadStep * view.scale;

  const width = document.width * view.scale;
  const height = document.height * view.scale;

  const left = view.offsetX;
  const top = view.offsetY;
  const right = left + width;
  const bottom = top + height;

  const rulerOffset = 18;
  const tickMinor = 5;
  const tickMajor = 10;

  const xTicks: React.ReactNode[] = [];
  for (let x = 0; x <= document.width; x += majorCadStep) {
    const sx = left + x * view.scale;
    xTicks.push(
      <g key={`x-tick-${x}`}>
        <line
          x1={sx}
          y1={bottom}
          x2={sx}
          y2={bottom + tickMajor}
          stroke={theme.cad.rulerTickMajor}
          strokeWidth={1}
        />
        <text
          x={sx}
          y={bottom + rulerOffset}
          fontSize="11"
          fill={theme.cad.rulerText}
          textAnchor="middle"
        >
          {x}
        </text>
      </g>,
    );
  }

  const yTicks: React.ReactNode[] = [];
  for (let y = 0; y <= document.height; y += majorCadStep) {
    const sy = bottom - y * view.scale;
    yTicks.push(
      <g key={`y-tick-${y}`}>
        <line
          x1={left - tickMajor}
          y1={sy}
          x2={left}
          y2={sy}
          stroke={theme.cad.rulerTickMajor}
          strokeWidth={1}
        />
        <text
          x={left - rulerOffset}
          y={sy + 4}
          fontSize="11"
          fill={theme.cad.rulerText}
          textAnchor="end"
        >
          {y}
        </text>
      </g>,
    );
  }

  const xMinorTicks: React.ReactNode[] = [];
  for (let x = 0; x <= document.width; x += minorCadStep) {
    if (x % majorCadStep === 0) continue;
    const sx = left + x * view.scale;
    xMinorTicks.push(
      <line
        key={`x-minor-${x}`}
        x1={sx}
        y1={bottom}
        x2={sx}
        y2={bottom + tickMinor}
        stroke={theme.cad.rulerTickMinor}
        strokeWidth={1}
      />,
    );
  }

  const yMinorTicks: React.ReactNode[] = [];
  for (let y = 0; y <= document.height; y += minorCadStep) {
    if (y % majorCadStep === 0) continue;
    const sy = bottom - y * view.scale;
    yMinorTicks.push(
      <line
        key={`y-minor-${y}`}
        x1={left - tickMinor}
        y1={sy}
        x2={left}
        y2={sy}
        stroke={theme.cad.rulerTickMinor}
        strokeWidth={1}
      />,
    );
  }

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
            stroke={theme.cad.gridMinor}
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
            stroke={theme.cad.gridMajor}
            strokeWidth="1.2"
          />
        </pattern>
      </defs>

      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        fill="url(#cad-grid-major)"
      />

      {/* Оси листа */}
      <line
        x1={left}
        y1={bottom}
        x2={right}
        y2={bottom}
        stroke={theme.cad.axisX}
        strokeWidth={1.5}
      />
      <line
        x1={left}
        y1={bottom}
        x2={left}
        y2={top}
        stroke={theme.cad.axisY}
        strokeWidth={1.5}
      />

      {/* Стрелки направлений */}
      <polygon
        points={`${right + 10},${bottom} ${right + 2},${bottom - 4} ${right + 2},${bottom + 4}`}
        fill={theme.cad.axisX}
      />
      <polygon
        points={`${left},${top - 10} ${left - 4},${top - 2} ${left + 4},${top - 2}`}
        fill={theme.cad.axisY}
      />

      {/* Линейка X */}
      <line
        x1={left}
        y1={bottom + 14}
        x2={right}
        y2={bottom + 14}
        stroke={theme.cad.ruler}
        strokeWidth={1}
      />
      {xMinorTicks}
      {xTicks}

      {/* Линейка Y */}
      <line
        x1={left - 14}
        y1={bottom}
        x2={left - 14}
        y2={top}
        stroke={theme.cad.ruler}
        strokeWidth={1}
      />
      {yMinorTicks}
      {yTicks}

      {/* Подписи направлений */}
      <text
        x={right + 18}
        y={bottom + 4}
        fontSize="12"
        fontWeight="700"
        fill={theme.cad.axisX}
      >
        +X
      </text>

      <text
        x={left - 28}
        y={bottom + 4}
        fontSize="12"
        fontWeight="700"
        fill={theme.cad.axisX}
        textAnchor="end"
      >
        -X
      </text>

      <text
        x={left + 6}
        y={top - 14}
        fontSize="12"
        fontWeight="700"
        fill={theme.cad.axisY}
      >
        +Y
      </text>

      <text
        x={left + 6}
        y={bottom + 28}
        fontSize="12"
        fontWeight="700"
        fill={theme.cad.axisY}
      >
        -Y
      </text>

      {/* Подписи осей */}
      <text
        x={right + 18}
        y={bottom + 22}
        fontSize="11"
        fontWeight="700"
        fill={theme.cad.axisText}
      >
        X
      </text>

      <text
        x={left - 14}
        y={top - 18}
        fontSize="11"
        fontWeight="700"
        fill={theme.cad.axisText}
        textAnchor="middle"
      >
        Y
      </text>

      {/* Ноль */}
      <circle cx={left} cy={bottom} r={3.5} fill={theme.cad.axisText} />
      <text
        x={left + 8}
        y={bottom - 8}
        fontSize="11"
        fontWeight="700"
        fill={theme.cad.axisText}
      >
        0,0
      </text>
    </>
  );
}