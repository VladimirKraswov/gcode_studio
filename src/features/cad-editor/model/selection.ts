import type { SketchSelectionRef } from "./types";

export type SelectionState = {
  refs: SketchSelectionRef[];
  primaryRef: SketchSelectionRef | null;
  ids: string[];
  primaryId: string | null;
};

function refKey(ref: SketchSelectionRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function toState(
  refs: SketchSelectionRef[],
  primaryRef: SketchSelectionRef | null,
): SelectionState {
  const uniqueRefs: SketchSelectionRef[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const key = refKey(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueRefs.push(ref);
  }

  const resolvedPrimary =
    primaryRef && uniqueRefs.some((ref) => refKey(ref) === refKey(primaryRef))
      ? primaryRef
      : uniqueRefs[0] ?? null;

  return {
    refs: uniqueRefs,
    primaryRef: resolvedPrimary,
    ids: uniqueRefs.map((ref) => ref.id),
    primaryId: resolvedPrimary?.id ?? null,
  };
}

export function makeShapeRef(id: string): SketchSelectionRef {
  return { kind: "shape", id };
}

export function makePointRef(id: string): SketchSelectionRef {
  return { kind: "point", id };
}

export function makeConstraintRef(id: string): SketchSelectionRef {
  return { kind: "constraint", id };
}

export function createSelection(
  primaryRef: SketchSelectionRef | null = null,
): SelectionState {
  return toState(primaryRef ? [primaryRef] : [], primaryRef);
}

export function clearSelection(): SelectionState {
  return toState([], null);
}

export function hasSelection(selection: SelectionState): boolean {
  return selection.refs.length > 0;
}

export function isSelected(
  selection: SelectionState,
  refOrId: SketchSelectionRef | string,
  kind?: SketchSelectionRef["kind"],
): boolean {
  if (typeof refOrId !== "string") {
    return selection.refs.some((ref) => refKey(ref) === refKey(refOrId));
  }

  if (kind) {
    return selection.refs.some((ref) => ref.kind === kind && ref.id === refOrId);
  }

  return selection.ids.includes(refOrId);
}

export function selectOnly(ref: SketchSelectionRef | string | null): SelectionState {
  if (!ref) return clearSelection();
  if (typeof ref === "string") {
    return createSelection(makeShapeRef(ref));
  }
  return createSelection(ref);
}

export function toggleSelection(
  selection: SelectionState,
  ref: SketchSelectionRef | string,
  kind: SketchSelectionRef["kind"] = "shape",
): SelectionState {
  const normalized = typeof ref === "string" ? { kind, id: ref } : ref;
  const exists = selection.refs.some((item) => refKey(item) === refKey(normalized));

  if (exists) {
    const nextRefs = selection.refs.filter((item) => refKey(item) !== refKey(normalized));
    const nextPrimary =
      selection.primaryRef && refKey(selection.primaryRef) === refKey(normalized)
        ? nextRefs[0] ?? null
        : selection.primaryRef;

    return toState(nextRefs, nextPrimary);
  }

  return toState([...selection.refs, normalized], normalized);
}

export function setPrimary(
  selection: SelectionState,
  ref: SketchSelectionRef | string | null,
  kind: SketchSelectionRef["kind"] = "shape",
): SelectionState {
  if (!ref) return clearSelection();

  const normalized = typeof ref === "string" ? { kind, id: ref } : ref;
  const exists = selection.refs.some((item) => refKey(item) === refKey(normalized));

  return toState(
    exists ? selection.refs : [...selection.refs, normalized],
    normalized,
  );
}