import { useEffect, useState } from "react";
import { getTextPolylines, type CadPoint } from "../geometry/textGeometry";
import type { SketchShape, SketchPoint } from "../model/types";

export type TextPreviewMap = Record<string, CadPoint[][]>;

export function useTextPreviewMap(shapes: SketchShape[], points: SketchPoint[]) {
  const [textPreviewMap, setTextPreviewMap] = useState<TextPreviewMap>({});

  useEffect(() => {
    let cancelled = false;

    async function buildTextPreview() {
      const nextMap: TextPreviewMap = {};

      for (const shape of shapes) {
        if (shape.type !== "text") continue;

        try {
          nextMap[shape.id] = await getTextPolylines(shape, points);
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
  }, [shapes, points]);

  return textPreviewMap;
}
