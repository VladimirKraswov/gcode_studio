export type TextToolState = {
  text: string;
  height: number;
  letterSpacing: number;
  fontFile: string;
};

export const DEFAULT_FONT_OPTIONS = [
  "/fonts/NotoSans-Regular.ttf",
  "/fonts/NotoSans-Bold.ttf",
  "/fonts/Roboto-Regular.ttf",
];

export function createDefaultTextToolState(): TextToolState {
  return {
    text: "GCode",
    height: 12,
    letterSpacing: 0,
    fontFile: DEFAULT_FONT_OPTIONS[0],
  };
}