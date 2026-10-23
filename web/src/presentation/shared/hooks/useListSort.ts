import { useCallback, useState } from "react";

import { DEFAULT_SORT, SORT_OPTION_VALUES, type SortOptionValue } from "@/shared/utils/sortItems";

import { useGlobalModals } from "./useGlobalModals";

const storageKey = (listId: string) => `tasktrail.sort.${listId}`;

// The choice is a per-viewer convenience: storage may be unavailable (private mode, blocked site data),
// then the list is sorted by default.
function readSort(listId: string): SortOptionValue {
  try {
    const value = localStorage.getItem(storageKey(listId));

    return SORT_OPTION_VALUES.find((option) => option === value) ?? DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

function writeSort(listId: string, value: SortOptionValue) {
  try {
    localStorage.setItem(storageKey(listId), value);
  } catch {
    // The choice lives until the page is reloaded
  }
}

/**
 * Sorting of a list: the choice is kept in localStorage under `tasktrail.sort.<listId>`, default — by
 * last update. `openSort` opens the sort modal with the current option; the list is sorted with
 * `sortItems(items, sort)` (shared/utils/sortItems.ts). `tasks` — a task list: the modal also offers
 * TASK_SORT_OPTIONS.
 */
export function useListSort(listId: string, { tasks }: { tasks?: boolean } = {}) {
  const [sort, setSort] = useState<SortOptionValue>(() => readSort(listId));
  const { showSortOptions } = useGlobalModals();

  const openSort = useCallback(async () => {
    const chosen = await showSortOptions(sort, tasks);

    if (!chosen) return;
    setSort(chosen);
    writeSort(listId, chosen);
  }, [listId, sort, tasks, showSortOptions]);

  return { sort, openSort };
}
