/** How a list is sorted: the options of the sort modal (Figma 1157:25705). */
export type SortOptionValue = "updatedAt" | "createdAt" | "nameAsc" | "nameDesc";

export const DEFAULT_SORT: SortOptionValue = "updatedAt";

export const SORT_OPTION_VALUES: readonly SortOptionValue[] = [
  "updatedAt",
  "createdAt",
  "nameAsc",
  "nameDesc",
];

interface Sortable {
  name: string;
  /** ISO 8601 in UTC */
  createdAt: string;
  /** ISO 8601 in UTC */
  updatedAt: string;
}

const byName = (a: Sortable, b: Sortable) => a.name.localeCompare(b.name, "ru");

// ISO 8601 strings in UTC compare as dates
const newestFirst = (field: "createdAt" | "updatedAt") => (a: Sortable, b: Sortable) =>
  b[field].localeCompare(a[field]);

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
  }[option];

  return [...items].sort(compare);
}
