export type ViewTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_VIEW: ViewTransform = {
  scale: 2.5,
  offsetX: 100,
  offsetY: 100,
};

export function createDefaultView(): ViewTransform {
  return { ...DEFAULT_VIEW };
}
