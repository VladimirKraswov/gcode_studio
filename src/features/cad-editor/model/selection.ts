export type SelectionState = {
  ids: string[];
  primaryId: string | null;
};

export function createSelection(primaryId: string | null = null): SelectionState {
  return {
    ids: primaryId ? [primaryId] : [],
    primaryId,
  };
}

export function clearSelection(): SelectionState {
  return {
    ids: [],
    primaryId: null,
  };
}

export function hasSelection(selection: SelectionState): boolean {
  return selection.ids.length > 0;
}

export function isSelected(selection: SelectionState, id: string): boolean {
  return selection.ids.includes(id);
}

export function selectOnly(id: string | null): SelectionState {
  return createSelection(id);
}

export function toggleSelection(selection: SelectionState, id: string): SelectionState {
  if (selection.ids.includes(id)) {
    const ids = selection.ids.filter((item) => item !== id);
    return {
      ids,
      primaryId: selection.primaryId === id ? (ids[0] ?? null) : selection.primaryId,
    };
  }

  return {
    ids: [...selection.ids, id],
    primaryId: id,
  };
}

export function setPrimary(selection: SelectionState, id: string | null): SelectionState {
  if (!id) return clearSelection();
  if (selection.ids.includes(id)) {
    return { ...selection, primaryId: id };
  }
  return {
    ids: [...selection.ids, id],
    primaryId: id,
  };
}