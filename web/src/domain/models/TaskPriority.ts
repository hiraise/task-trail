import type { TaskPriorityId } from "../types";

/** Priorities from the most urgent — the order of pickers and of the priority sort (ADR-0033). */
export const TASK_PRIORITY_ORDER: readonly TaskPriorityId[] = ["urgent", "high", "normal", "low"];

/** The priority of a new task when none is chosen. */
export const DEFAULT_TASK_PRIORITY: TaskPriorityId = "normal";
