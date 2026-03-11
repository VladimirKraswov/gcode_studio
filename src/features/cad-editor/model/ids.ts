export function createId(prefix = "shape"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

