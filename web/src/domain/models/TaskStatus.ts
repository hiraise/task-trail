import type { TaskStatusId } from "../types";

/** A task status from the shared set (ADR-0003). */
export interface TaskStatus {
  id: TaskStatusId;
  /** Name for the UI */
  name: string;
  /** Status of a new task */
  isDefault: boolean;
  /** The task is done */
  isResolved: boolean;
}
