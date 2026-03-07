function round(value: number): number {
  return Number(value.toFixed(3));
}

export function fmt(value: number): string {
  return round(value).toFixed(3).replace(/\.?0+$/, "");
}
