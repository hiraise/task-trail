import { addDays, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale/ru";

import { tasksTexts } from "@/shared/locales/tasks";

// A due date is a calendar day YYYY-MM-DD (ADR-0034). Never pass it through `new Date("2026-10-30")`:
// that is UTC midnight and shows the previous day west of UTC. `parseISO` reads it as a local day.

/** Today's local date as YYYY-MM-DD — what due dates are compared with (ADR-0034). */
export const todayLocal = (now = new Date()) => format(now, "yyyy-MM-dd");

export type DueDateState = "overdue" | "today" | "tomorrow" | "later";

const tomorrowOf = (today: string) => format(addDays(parseISO(today), 1), "yyyy-MM-dd");

/** How close the due date is; a resolved task is never overdue. YYYY-MM-DD strings compare as dates. */
export function dueDateState(dueDate: string, resolved: boolean, today = todayLocal()): DueDateState {
  if (dueDate === today) return "today";
  if (dueDate === tomorrowOf(today)) return "tomorrow";
  if (dueDate < today && !resolved) return "overdue";

  return "later";
}

/** The due date is set, before today and the task is not resolved — drawn in --text-critical. */
export const isOverdue = (dueDate: string | undefined, resolved: boolean, today = todayLocal()) =>
  dueDate !== undefined && dueDateState(dueDate, resolved, today) === "overdue";

/**
 * Today, tomorrow (tasksTexts.today, .tomorrow), else the day and short month like "30 Oct", another
 * year with the year (date-fns, ru, the trailing dot removed).
 */
export function formatDueDate(dueDate: string, today = todayLocal()): string {
  if (dueDate === today) return tasksTexts.today;
  if (dueDate === tomorrowOf(today)) return tasksTexts.tomorrow;

  const date = parseISO(dueDate);
  const dayMonth = format(date, "d MMM", { locale: ru }).replace(/\.$/, "");

  return dueDate.slice(0, 4) === today.slice(0, 4) ? dayMonth : `${dayMonth} ${format(date, "yyyy")}`;
}
