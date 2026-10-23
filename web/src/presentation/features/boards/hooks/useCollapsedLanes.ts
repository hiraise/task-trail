import { useCallback, useState } from "react";

import type { BoardId } from "@/domain/types";

const storageKey = (boardId: BoardId) => `tasktrail.board.${boardId}.collapsedLanes`;

// Storage may be unavailable (private mode, blocked site data) — then lanes are just expanded
function read(boardId: BoardId): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(boardId)) ?? "[]");

    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function write(boardId: BoardId, keys: string[]) {
  try {
    localStorage.setItem(storageKey(boardId), JSON.stringify(keys));
  } catch {
    // The lane still collapses; it is not remembered
  }
}

/** Collapsed kanban swimlanes; remembered per board in this browser (stage 2 plan, step 5). */
export function useCollapsedLanes(boardId: BoardId) {
  const [collapsed, setCollapsed] = useState(() => new Set(read(boardId)));

  const toggle = useCallback(
    (laneKey: string) =>
      setCollapsed((prev) => {
        const next = new Set(prev);

        if (!next.delete(laneKey)) next.add(laneKey);
        write(boardId, [...next]);

        return next;
      }),
    [boardId],
  );

  return { collapsed, toggle };
}
