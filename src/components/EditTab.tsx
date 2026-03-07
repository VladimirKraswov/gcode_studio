import { useEffect, useMemo, useRef, useState } from "react";
import type {
  SketchDocument,
  SketchPolylinePoint,
  SketchShape,
  SketchText,
  SketchTool,
} from "../types/sketch";
import { getTextPolylines, type CadPoint } from "../utils/fontGeometry";
import {
  createId,
  generateSketchGCode,
  moveShape,
} from "../utils/sketch";
import {
  cadToScreenPoint,
  screenToCadPoint,
  type ViewTransform,
} from "../utils/coordinates";

type EditTabProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  onGenerateGCode: (gcode: string) => void;
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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
}: EditTabProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tool, setTool] = useState<SketchTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selectedShape = useMemo(
    () => document.shapes.find((shape) => shape.id === selectedId) ?? null,
    [document.shapes, selectedId],
  );

  useEffect(() => {
    let cancelled = false;

    async function buildTextPreview() {
      const nextMap: TextPreviewMap = {};

      for (const shape of document.shapes) {
        if (shape.type !== "text") {
          continue;
        }

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
    setView({
      scale: 2.5,
      offsetX: 40,
      offsetY: 40,
    });
  }

  function addRectangle(x: number, y: number, width: number, height: number) {
    if (width < 1 || height < 1) {
      return;
    }

    const shape: SketchShape = {
      id: createId("rect"),
      type: "rectangle",
      name: `Rectangle ${document.shapes.filter((s) => s.type === "rectangle").length + 1}`,
      x,
      y,
      width,
      height,
      cutZ: null,
    };

    setDocument((prev) => ({ ...prev, shapes: [...prev.shapes, shape] }));
    setSelectedId(shape.id);
  }

  function addCircle(cx: number, cy: number, radius: number) {
    if (radius < 1) {
      return;
    }

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
    setSelectedId(shape.id);
  }

  function addText(x: number, y: number) {
    const value = textDraft.trim();
    if (!value) {
      return;
    }

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
    setSelectedId(shape.id);
  }

  function commitPolyline() {
    if (polylineDraft.length < 2) {
      setPolylineDraft([]);
      return;
    }

    const shape: SketchShape = {
      id: createId("poly"),
      type: "polyline",
      name: `Polyline ${document.shapes.filter((s) => s.type === "polyline").length + 1}`,
      points: polylineDraft,
      closed: false,
      cutZ: null,
    };

    setDocument((prev) => ({ ...prev, shapes: [...prev.shapes, shape] }));
    setSelectedId(shape.id);
    setPolylineDraft([]);
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) {
      return;
    }

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
    if (!svgRef.current) {
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const cad = screenToCadPoint(
      event.clientX,
      event.clientY,
      rect,
      document.height,
      view,
    );

    if (draft) {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              endX: cad.x,
              endY: cad.y,
            }
          : null,
      );
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
    if (!selectedId) {
      return;
    }

    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.filter((shape) => shape.id !== selectedId),
    }));
    setSelectedId(null);
  }

  function updateSelected(patch: Record<string, number | string | boolean | null>) {
    if (!selectedId) {
      return;
    }

    setDocument((prev) => ({
      ...prev,
      shapes: prev.shapes.map((shape) => {
        if (shape.id !== selectedId) {
          return shape;
        }

        return { ...shape, ...patch } as SketchShape;
      }),
    }));
  }

  function bindSelectStart(
    event: React.PointerEvent<SVGElement>,
    shapeId: string,
  ) {
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

    setSelectedId(shapeId);

    if (tool === "select") {
      setDragState({
        shapeId,
        startX: cad.x,
        startY: cad.y,
      });
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
            fill={isSelected ? "rgba(37,99,235,0.15)" : "rgba(15,23,42,0.06)"}
            stroke={isSelected ? "#2563eb" : "#334155"}
            strokeWidth={isSelected ? 2 : 1.5}
            onPointerDown={(event) => bindSelectStart(event, shape.id)}
          />
        );
      }

      case "circle": {
        const p = cadToScreenPoint({ x: shape.cx, y: shape.cy }, document.height, view);
        return (
          <circle
            key={shape.id}
            cx={p.x}
            cy={p.y}
            r={shape.radius * view.scale}
            fill={isSelected ? "rgba(37,99,235,0.15)" : "rgba(15,23,42,0.06)"}
            stroke={isSelected ? "#2563eb" : "#334155"}
            strokeWidth={isSelected ? 2 : 1.5}
            onPointerDown={(event) => bindSelectStart(event, shape.id)}
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
            stroke={isSelected ? "#2563eb" : "#334155"}
            strokeWidth={isSelected ? 2 : 1.5}
            onPointerDown={(event) => bindSelectStart(event, shape.id)}
          />
        );
      }

      case "text": {
        const polylines = textPreviewMap[shape.id] ?? [];

        return (
          <g key={shape.id} onPointerDown={(event) => bindSelectStart(event, shape.id)}>
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
                stroke={isSelected ? "#2563eb" : "#334155"}
                strokeWidth={isSelected ? 2 : 1.5}
              />
            ))}
          </g>
        );
      }
    }
  }

  const selectedText = selectedShape?.type === "text" ? (selectedShape as SketchText) : null;

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
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 16,
        height: 860,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button type="button" onClick={() => setTool("select")}>Select</button>
          <button type="button" onClick={() => setTool("rectangle")}>Rectangle</button>
          <button type="button" onClick={() => setTool("circle")}>Circle</button>
          <button type="button" onClick={() => setTool("polyline")}>Polyline</button>
          <button type="button" onClick={() => setTool("text")}>Text</button>
          <button type="button" onClick={commitPolyline}>Finish polyline</button>
          <button type="button" onClick={deleteSelected}>Delete</button>
          <button type="button" onClick={resetView}>Reset view</button>
          <button
            type="button"
            onClick={handleGenerateClick}
            disabled={isGenerating}
            style={{ marginLeft: "auto" }}
          >
            {isGenerating ? "Генерация..." : "Сгенерировать G-code"}
          </button>
        </div>

        {tool === "text" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 100px",
              gap: 8,
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <label style={{ fontSize: 12 }}>
              Текст
              <input
                type="text"
                value={textDraft}
                onChange={(event) => setTextDraft(event.target.value)}
                style={{ width: "100%" }}
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Высота
              <input
                type="number"
                min="2"
                value={textHeightDraft}
                onChange={(event) => setTextHeightDraft(Math.max(2, Number(event.target.value) || 2))}
                style={{ width: "100%" }}
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Интервал
              <input
                type="number"
                min="0"
                step="0.5"
                value={textLetterSpacingDraft}
                onChange={(event) =>
                  setTextLetterSpacingDraft(Math.max(0, Number(event.target.value) || 0))
                }
                style={{ width: "100%" }}
              />
            </label>

            <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>
              Шрифт
              <select
                value={textFontDraft}
                onChange={(event) => setTextFontDraft(event.target.value)}
                style={{ width: "100%" }}
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
            flex: 1,
            minHeight: 0,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            background: "#f8fafc",
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            style={{ display: "block", touchAction: "none", cursor: "crosshair" }}
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
              fill="rgba(255,255,255,0.72)"
              stroke="#cbd5e1"
              strokeWidth={1.5}
            />

            {(() => {
              const origin = cadToScreenPoint({ x: 0, y: 0 }, document.height, view);
              return (
                <g>
                  <circle cx={origin.x} cy={origin.y} r={4} fill="#ef4444" />
                  <text x={origin.x + 8} y={origin.y - 8} fontSize="12" fill="#0f172a">
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
          background: "white",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "auto",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Параметры</h3>

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: 12 }}>
            Ширина листа
            <input
              type="number"
              value={document.width}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  width: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Высота листа
            <input
              type="number"
              value={document.height}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  height: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Safe Z
            <input
              type="number"
              value={document.safeZ}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  safeZ: Number(event.target.value) || 0,
                }))
              }
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Cut Z по умолчанию
            <input
              type="number"
              value={document.cutZ}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  cutZ: Number(event.target.value) || 0,
                }))
              }
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Feed cut
            <input
              type="number"
              value={document.feedCut}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  feedCut: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Feed rapid
            <input
              type="number"
              value={document.feedRapid}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  feedRapid: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
            <input
              type="checkbox"
              checked={document.spindleOn}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  spindleOn: event.target.checked,
                }))
              }
            />
            Лазер / spindle M3/M5
          </label>

          <label style={{ fontSize: 12 }}>
            S power
            <input
              type="number"
              value={document.laserPower}
              onChange={(event) =>
                setDocument((prev) => ({
                  ...prev,
                  laserPower: Math.max(0, Number(event.target.value) || 0),
                }))
              }
              style={{ width: "100%" }}
            />
          </label>
        </div>

        {selectedShape && (
          <>
            <h3 style={{ marginTop: 20 }}>Выбранный объект</h3>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontSize: 12 }}>
                Name
                <input
                  type="text"
                  value={selectedShape.name}
                  onChange={(event) => updateSelected({ name: event.target.value })}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ fontSize: 12 }}>
                Индивидуальная глубина Z
                <input
                  type="number"
                  value={selectedShape.cutZ ?? document.cutZ}
                  onChange={(event) => updateSelected({ cutZ: Number(event.target.value) || 0 })}
                  style={{ width: "100%" }}
                />
              </label>

              {selectedShape.type === "rectangle" && (
                <>
                  <label style={{ fontSize: 12 }}>
                    X
                    <input
                      type="number"
                      value={selectedShape.x}
                      onChange={(event) => updateSelected({ x: Number(event.target.value) || 0 })}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    Y
                    <input
                      type="number"
                      value={selectedShape.y}
                      onChange={(event) => updateSelected({ y: Number(event.target.value) || 0 })}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    Width
                    <input
                      type="number"
                      value={selectedShape.width}
                      onChange={(event) =>
                        updateSelected({ width: clamp(Number(event.target.value) || 1, 1, 100000) })
                      }
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    Height
                    <input
                      type="number"
                      value={selectedShape.height}
                      onChange={(event) =>
                        updateSelected({ height: clamp(Number(event.target.value) || 1, 1, 100000) })
                      }
                      style={{ width: "100%" }}
                    />
                  </label>
                </>
              )}

              {selectedShape.type === "circle" && (
                <>
                  <label style={{ fontSize: 12 }}>
                    CX
                    <input
                      type="number"
                      value={selectedShape.cx}
                      onChange={(event) => updateSelected({ cx: Number(event.target.value) || 0 })}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    CY
                    <input
                      type="number"
                      value={selectedShape.cy}
                      onChange={(event) => updateSelected({ cy: Number(event.target.value) || 0 })}
                      style={{ width: "100%" }}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    Radius
                    <input
                      type="number"
                      value={selectedShape.radius}
                      onChange={(event) =>
                        updateSelected({
                          radius: clamp(Number(event.target.value) || 1, 1, 100000),
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </label>
                </>
              )}

              {selectedShape.type === "polyline" && (
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={selectedShape.closed}
                    onChange={(event) => updateSelected({ closed: event.target.checked })}
                  />
                  Closed
                </label>
              )}

              {selectedText && (
                <>
                  <label style={{ fontSize: 12 }}>
                    Text
                    <input
                      type="text"
                      value={selectedText.text}
                      onChange={(event) => updateSelected({ text: event.target.value })}
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    X
                    <input
                      type="number"
                      value={selectedText.x}
                      onChange={(event) => updateSelected({ x: Number(event.target.value) || 0 })}
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Y
                    <input
                      type="number"
                      value={selectedText.y}
                      onChange={(event) => updateSelected({ y: Number(event.target.value) || 0 })}
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Height
                    <input
                      type="number"
                      value={selectedText.height}
                      onChange={(event) =>
                        updateSelected({ height: clamp(Number(event.target.value) || 2, 2, 100000) })
                      }
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Letter spacing
                    <input
                      type="number"
                      step="0.5"
                      value={selectedText.letterSpacing}
                      onChange={(event) =>
                        updateSelected({ letterSpacing: Math.max(0, Number(event.target.value) || 0) })
                      }
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Font
                    <select
                      value={selectedText.fontFile}
                      onChange={(event) => updateSelected({ fontFile: event.target.value })}
                      style={{ width: "100%" }}
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>
                          {font.split("/").pop()}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Rotation
                    <input
                      type="number"
                      value={selectedText.rotation ?? 0}
                      onChange={(event) => updateSelected({ rotation: Number(event.target.value) || 0 })}
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Align
                    <select
                      value={selectedText.align ?? "left"}
                      onChange={(event) => updateSelected({ align: event.target.value })}
                      style={{ width: "100%" }}
                    >
                      <option value="left">left</option>
                      <option value="center">center</option>
                      <option value="right">right</option>
                    </select>
                  </label>
                </>
              )}
            </div>
          </>
        )}

        <h3 style={{ marginTop: 20 }}>Результат</h3>
        <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
          Текст теперь строится по контурам TTF-шрифта через opentype.js и
          генерируется в G-code как outline, ближе к CAD/CAM-логике.
        </p>
      </div>
    </div>
  );
}