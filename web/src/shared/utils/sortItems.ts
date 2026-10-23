import { TASK_PRIORITY_ORDER } from "@/domain/models/TaskPriority";
import type { TaskPriorityId } from "@/domain/types";

/** How a list is sorted: the options of the sort modal (Figma 1157:25705, stage 3 artboard H). */
export type SortOptionValue = "updatedAt" | "createdAt" | "nameAsc" | "nameDesc" | "priority";

export const DEFAULT_SORT: SortOptionValue = "updatedAt";

export const SORT_OPTION_VALUES: readonly SortOptionValue[] = [
  "updatedAt",
  "createdAt",
  "nameAsc",
  "nameDesc",
  "priority",
];

/** Options shown only for task lists: other items have no such field. */
export const TASK_SORT_OPTIONS = ["priority"] as const satisfies readonly SortOptionValue[];

interface Sortable {
  name: string;
  /** ISO 8601 in UTC */
  createdAt: string;
  /** ISO 8601 in UTC */
  updatedAt: string;
  /** Tasks only (ADR-0033) */
  priority?: TaskPriorityId;
}

const byName = (a: Sortable, b: Sortable) => a.name.localeCompare(b.name, "ru");

// ISO 8601 strings in UTC compare as dates
const newestFirst = (field: "createdAt" | "updatedAt") => (a: Sortable, b: Sortable) =>
  b[field].localeCompare(a[field]);

// An item without a priority goes last
const priorityRank = (item: Sortable) =>
  item.priority ? TASK_PRIORITY_ORDER.indexOf(item.priority) : TASK_PRIORITY_ORDER.length;

// The most urgent first; ties — newest updated first (ADR-0033)
const byPriority = (a: Sortable, b: Sortable) =>
  priorityRank(a) - priorityRank(b) || newestFirst("updatedAt")(a, b);

/**
 * A sorted copy of the list. Lists are not paginated, so the web sorts them (ADR-0027): dates — newest
 * first, names — in Russian alphabetical order. Equal items keep the server order.
 */
export function sortItems<T extends Sortable>(items: readonly T[], option: SortOptionValue): T[] {
  const compare = {
    updatedAt: newestFirst("updatedAt"),
    createdAt: newestFirst("createdAt"),
    nameAsc: byName,
    nameDesc: (a: Sortable, b: Sortable) => byName(b, a),
    priority: byPriority,
  }[option];

  return [...items].sort(compare);
}
