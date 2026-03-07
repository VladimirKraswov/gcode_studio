import { useEffect, useRef, useState } from "react";
import type {
  SketchDocument,
  SketchPolylinePoint,
  SketchShape,
  SketchTool,
} from "../types/sketch";
import { getTextPolylines, type CadPoint } from "../utils/fontGeometry";
import { createId, generateSketchGCode, moveShape } from "../utils/sketch";
import {
  cadToScreenPoint,
  screenToCadPoint,
  type ViewTransform,
} from "../utils/coordinates";
import { theme, ui } from "../styles/ui";
import {
  FiCheck,
  FiCircle,
  FiEdit3,
  FiMaximize,
  FiMousePointer,
  FiPlay,
  FiSquare,
  FiTrash2,
  FiType,
  FiPenTool,
} from "react-icons/fi";

type EditTabProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  onGenerateGCode: (gcode: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

type DraftShape =
  | {
      type: "rectangle";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "circle";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | null;

type TextPreviewMap = Record<string, CadPoint[][]>;

const FONT_OPTIONS = [
  "/fonts/NotoSans-Regular.ttf",
  "/fonts/NotoSans-Bold.ttf",
  "/fonts/Roboto-Regular.ttf",
];

const tools: Array<{
  id: SketchTool;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  {
    id: "select",
    label: "Select",
    hint: "Выделение и перетаскивание объектов",
    icon: <FiMousePointer size={16} />,
  },
  {
    id: "rectangle",
    label: "Rectangle",
    hint: "Нарисовать прямоугольник",
    icon: <FiSquare size={16} />,
  },
  {
    id: "circle",
    label: "Circle",
    hint: "Нарисовать окружность",
    icon: <FiCircle size={16} />,
  },
  {
    id: "polyline",
    label: "Polyline",
    hint: "Добавление точек полилинии",
    icon: <FiPenTool size={16} />,
  },
  {
    id: "text",
    label: "Text",
    hint: "Вставка текстового объекта",
    icon: <FiType size={16} />,
  },
];

function getRectangleFromDraft(draft: NonNullable<DraftShape>) {
  const x = Math.min(draft.startX, draft.endX);
  const y = Math.min(draft.startY, draft.endY);
  const width = Math.abs(draft.endX - draft.startX);
  const height = Math.abs(draft.endY - draft.startY);
  return { x, y, width, height };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function EditTab({
  document,
  setDocument,
  onGenerateGCode,
  selectedId,
  onSelect,
}: EditTabProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tool, setTool] = useState<SketchTool>("select");
  const [draft, setDraft] = useState<DraftShape>(null);
  const [polylineDraft, setPolylineDraft] = useState<SketchPolylinePoint[]>([]);
  const [textDraft, setTextDraft] = useState("Привет");
  const [textHeightDraft, setTextHeightDraft] = useState(12);
  const [textLetterSpacingDraft, setTextLetterSpacingDraft] = useState(0);
  const [textFontDraft, setTextFontDraft] = useState(FONT_OPTIONS[0]);
  const [textPreviewMap, setTextPreviewMap] = useState<TextPreviewMap>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragState, setDragState] = useState<{
    shapeId: string;
    startX: number;
    startY: number;
  } | null>(null);

  const [view, setView] = useState<ViewTransform>({
    scale: 2.5,
    offsetX: 40,
    offsetY: 40,
  });

  useEffect(() => {
    let cancelled = false;

    async function buildTextPreview() {
      const nextMap: TextPreviewMap = {};

      for (const shape of document.shapes) {
        if (shape.type !== "text") continue;

        try {
          nextMap[shape.id] = await getTextPolylines(shape);
        } catch {
          nextMap[shape.id] = [];
        }
      }

      if (!cancelled) {
        setTextPreviewMap(nextMap);
      }
    }

    void buildTextPreview();

    return () => {
      cancelled = true;
    };
  }, [document.shapes]);

  function resetView() {
    setView({ scale: 2.5, offsetX: 40, offsetY: 40 });
  }

  function addRectangle(x: number, y: number, width: number, height: number) {
    if (width < 1 || height < 1) return;

    const shape: SketchShape = {
      id: createId("rect"),
      type: "rectangle",
      name: `Rectangle ${
        document.shapes.filter((s) => s.type === "rectangle").length + 1
      }`,
      x,
      y,
      width,
      height,
      cutZ: null,
    };

    setDocument((prev) => ({ ...prev, shapes: [...prev.shapes, shape] }));
    onSelect(shape.id);
  }

  function addCircle(cx: number, cy: number, radius: number) {
    if (radius < 1) return;

    const shape: SketchShape = {
      id: createId("circle"),
      type: "circle",
      name: `Circle ${document.shapes.filter((s) => s.type === "circle").length + 1}`,
      cx,
      cy,
      radius,
      cutZ: null,
    };

    setDocument((prev) => ({ ...prev, shapes: [...prev.shapes, shape] }));
    onSelect(shape.id);
  }

  function addText(x: number, y: number) {
    const value = textDraft.trim();
    if (!value) return;

    const shape: SketchShape = {
      id: createId("text"),
      type: "text",
      name: `Text ${document.shapes.filter((s) => s.type === "text").length + 1}`,
      x,
      y,
      text: value,
      height: Math.max(2, textHeightDraft),
      letterSpacing: Math.max(0, textLetterSpacingDraft),
      fontFile: textFontDraft,
      rotation: 0,
      align: "left",
      cutMode: "outline",
      cutZ: null,
    };

    setDocument((prev) => ({ ...prev, shapes: [...prev.shapes, shape] }));
    onSelect(shape.id);
  }

  function commitPolyline() {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      return;
    }

    const shape: SketchShape = {
      id: createId("poly"),
      type: "polyline",
      name: `Polyline ${
        document.shapes.filter((s) => s.type === "polyline").length + 1
      }`,
      points: polylineDraft,
      closed: false,
      cutZ: null,
    };

    setDocument((prev) => ({ ...prev, shapes: [...prev.shapes, shape] }));
    onSelect(shape.id);
    setPolylineDraft([]);
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cad = screenToCadPoint(
      event.clientX,
      event.clientY,
      rect,
      document.height,
      view,
    );

    if (tool === "rectangle") {
      setDraft({
        type: "rectangle",
        startX: cad.x,
        startY: cad.y,
        endX: cad.x,
        endY: cad.y,
      });
      return;
    }

    if (tool === "circle") {
      setDraft({
        type: "circle",
        startX: cad.x,
        startY: cad.y,
        endX: cad.x,
        endY: cad.y,
      });
      return;
    }

    if (tool === "polyline") {
      setPolylineDraft((prev) => [...prev, { x: cad.x, y: cad.y }]);
      return;
    }

    if (tool === "text") {
      addText(cad.x, cad.y);
    }
  }

  function handleCanvasPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cad = screenToCadPoint(
      event.clientX,
      event.clientY,
      rect,
      document.height,
      view,
    );

    if (draft) {
      setDraft((prev) => (prev ? { ...prev, endX: cad.x, endY: cad.y } : null));
      return;
    }

    if (dragState) {
      const dx = cad.x - dragState.startX;
      const dy = cad.y - dragState.startY;

      setDocument((prev) => ({
        ...prev,
        shapes: prev.shapes.map((shape) =>
          shape.id === dragState.shapeId ? moveShape(shape, dx, dy) : shape,
        ),
      }));

      setDragState({
        shapeId: dragState.shapeId,
        startX: cad.x,
        startY: cad.y,
      });
    }
  }

  function handleCanvasPointerUp() {
    if (draft?.type === "rectangle") {
      const rect = getRectangleFromDraft(draft);
      addRectangle(rect.x, rect.y, rect.width, rect.height);
    }

    if (draft?.type === "circle") {
      const radius = distance(
        { x: draft.startX, y: draft.startY },
        { x: draft.endX, y: draft.endY },
      );
      addCircle(draft.startX, draft.startY, radius);
    }

    setDraft(null);
    setDragState(null);
  }

  function deleteSelected() {
    if (!selectedId) return;

    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.filter((shape) => shape.id !== selectedId),
    }));

    onSelect(null);
  }

  function bindSelectStart(event: React.PointerEvent<SVGElement>, shapeId: string) {
    event.stopPropagation();
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cad = screenToCadPoint(
      event.clientX,
      event.clientY,
      rect,
      document.height,
      view,
    );

    onSelect(shapeId);

    if (tool === "select") {
      setDragState({ shapeId, startX: cad.x, startY: cad.y });
    }
  }

  function renderShape(shape: SketchShape) {
    const isSelected = shape.id === selectedId;

    switch (shape.type) {
      case "rectangle": {
        const p = cadToScreenPoint(
          { x: shape.x, y: shape.y + shape.height },
          document.height,
          view,
        );

        return (
          <rect
            key={shape.id}
            x={p.x}
            y={p.y}
            width={shape.width * view.scale}
            height={shape.height * view.scale}
            fill={isSelected ? "rgba(37,99,235,0.15)" : "rgba(15,23,42,0.05)"}
            stroke={isSelected ? "#2563eb" : "#475569"}
            strokeWidth={isSelected ? 2 : 1.5}
            rx={8}
            onPointerDown={(e) => bindSelectStart(e, shape.id)}
          />
        );
      }

      case "circle": {
        const p = cadToScreenPoint(
          { x: shape.cx, y: shape.cy },
          document.height,
          view,
        );

        return (
          <circle
            key={shape.id}
            cx={p.x}
            cy={p.y}
            r={shape.radius * view.scale}
            fill={isSelected ? "rgba(37,99,235,0.15)" : "rgba(15,23,42,0.05)"}
            stroke={isSelected ? "#2563eb" : "#475569"}
            strokeWidth={isSelected ? 2 : 1.5}
            onPointerDown={(e) => bindSelectStart(e, shape.id)}
          />
        );
      }

      case "polyline": {
        const points = shape.points
          .map((point) => {
            const p = cadToScreenPoint(point, document.height, view);
            return `${p.x},${p.y}`;
          })
          .join(" ");

        return (
          <polyline
            key={shape.id}
            points={points}
            fill="none"
            stroke={isSelected ? "#2563eb" : "#475569"}
            strokeWidth={isSelected ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            onPointerDown={(e) => bindSelectStart(e, shape.id)}
          />
        );
      }

      case "text": {
        const polylines = textPreviewMap[shape.id] ?? [];

        return (
          <g key={shape.id} onPointerDown={(e) => bindSelectStart(e, shape.id)}>
            {polylines.map((polyline, index) => (
              <polyline
                key={`${shape.id}-${index}`}
                points={polyline
                  .map((point) => {
                    const p = cadToScreenPoint(point, document.height, view);
                    return `${p.x},${p.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={isSelected ? "#2563eb" : "#475569"}
                strokeWidth={isSelected ? 2 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        );
      }
    }
  }

  async function handleGenerateClick() {
    setIsGenerating(true);
    try {
      const gcode = await generateSketchGCode(document);
      onGenerateGCode(gcode);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div
      style={{
        ...ui.panel,
        padding: 16,
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          ...ui.panelInset,
          padding: 10,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tools.map((item) => {
            const active = tool === item.id;

            return (
              <button
                key={item.id}
                type="button"
                title={`${item.label} — ${item.hint}`}
                onClick={() => setTool(item.id)}
                style={{
                  ...(active ? ui.buttonPrimary : ui.buttonGhost),
                  width: 38,
                  height: 38,
                  padding: 0,
                }}
              >
                {item.icon}
              </button>
            );
          })}

          <button
            type="button"
            title="Завершить текущую полилинию"
            onClick={commitPolyline}
            style={{ ...ui.buttonGhost, width: 38, height: 38, padding: 0 }}
          >
            <FiCheck size={16} />
          </button>

          <button
            type="button"
            title="Удалить выбранный объект"
            onClick={deleteSelected}
            style={{ ...ui.buttonDanger, width: 38, height: 38, padding: 0 }}
          >
            <FiTrash2 size={16} />
          </button>

          <button
            type="button"
            title="Сбросить масштаб и позицию холста"
            onClick={resetView}
            style={{ ...ui.buttonGhost, width: 38, height: 38, padding: 0 }}
          >
            <FiMaximize size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          title="Сгенерировать G-code из текущего документа"
          style={{ ...ui.buttonPrimary, flexShrink: 0 }}
        >
          <FiPlay size={16} />
          {isGenerating ? "Генерация..." : "Сгенерировать G-code"}
        </button>
      </div>

      {tool === "text" && (
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
            <input
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              style={ui.input}
            />
          </label>

          <label style={miniLabel}>
            Высота
            <input
              type="number"
              min="2"
              value={textHeightDraft}
              onChange={(e) =>
                setTextHeightDraft(Math.max(2, Number(e.target.value) || 2))
              }
              style={ui.input}
            />
          </label>

          <label style={miniLabel}>
            Интервал
            <input
              type="number"
              min="0"
              step="0.5"
              value={textLetterSpacingDraft}
              onChange={(e) =>
                setTextLetterSpacingDraft(Math.max(0, Number(e.target.value) || 0))
              }
              style={ui.input}
            />
          </label>

          <label style={{ ...miniLabel, gridColumn: "1 / -1" }}>
            Шрифт
            <select
              value={textFontDraft}
              onChange={(e) => setTextFontDraft(e.target.value)}
              style={ui.select}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font.split("/").pop()}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div
        style={{
          ...ui.panelInset,
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          background: "#f8fafc",
          display: "flex",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              touchAction: "none",
              cursor:
                tool === "select"
                  ? "default"
                  : tool === "text"
                  ? "text"
                  : "crosshair",
            }}
          >
            <defs>
              <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            <rect
              x={view.offsetX}
              y={view.offsetY}
              width={document.width * view.scale}
              height={document.height * view.scale}
              fill="rgba(255,255,255,0.86)"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              rx={12}
            />

            {(() => {
              const origin = cadToScreenPoint({ x: 0, y: 0 }, document.height, view);

              return (
                <g>
                  <circle cx={origin.x} cy={origin.y} r={4} fill="#ef4444" />
                  <text
                    x={origin.x + 8}
                    y={origin.y - 8}
                    fontSize="12"
                    fill="#0f172a"
                  >
                    X0 Y0
                  </text>
                </g>
              );
            })()}

            {document.shapes.map(renderShape)}

            {polylineDraft.length > 1 && (
              <polyline
                points={polylineDraft
                  .map((point) => {
                    const p = cadToScreenPoint(point, document.height, view);
                    return `${p.x},${p.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {draft?.type === "rectangle" &&
              (() => {
                const rect = getRectangleFromDraft(draft);
                const p = cadToScreenPoint(
                  { x: rect.x, y: rect.y + rect.height },
                  document.height,
                  view,
                );

                return (
                  <rect
                    x={p.x}
                    y={p.y}
                    width={rect.width * view.scale}
                    height={rect.height * view.scale}
                    fill="rgba(37,99,235,0.12)"
                    stroke="#2563eb"
                    strokeDasharray="6 4"
                    rx={8}
                  />
                );
              })()}

            {draft?.type === "circle" &&
              (() => {
                const r = distance(
                  { x: draft.startX, y: draft.startY },
                  { x: draft.endX, y: draft.endY },
                );
                const center = cadToScreenPoint(
                  { x: draft.startX, y: draft.startY },
                  document.height,
                  view,
                );

                return (
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={r * view.scale}
                    fill="rgba(37,99,235,0.12)"
                    stroke="#2563eb"
                    strokeDasharray="6 4"
                  />
                );
              })()}
          </svg>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 12,
          color: theme.textMuted,
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        <span>Инструменты сверху работают по подсказкам при наведении</span>
        <span>Объектов: {document.shapes.length}</span>
      </div>
    </div>
  );
}

const miniLabel: React.CSSProperties = {
  ...ui.inputLabel,
};