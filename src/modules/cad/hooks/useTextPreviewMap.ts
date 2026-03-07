import { useEffect, useState } from "react";
import { getTextPolylines, type CadPoint } from "../geometry/textGeometry";
import type { SketchShape } from "../model/types";

export type TextPreviewMap = Record<string, CadPoint[][]>;

export function useTextPreviewMap(shapes: SketchShape[]) {
  const [textPreviewMap, setTextPreviewMap] = useState<TextPreviewMap>({});

  useEffect(() => {
    let cancelled = false;

    async function buildTextPreview() {
      const nextMap: TextPreviewMap = {};

      for (const shape of shapes) {
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
  }, [shapes]);

  return textPreviewMap;
}