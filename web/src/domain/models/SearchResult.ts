import type { Board } from "./Board";
import type { Project } from "./Project";
import type { Task } from "./Task";

/**
 * Search results by group, at most 20 each (ADR-0030). Archived projects and tasks are included:
 * `archivedAt` and `Task.projectArchived` mark them.
 */
export interface SearchResult {
  /** By name */
  projects: Project[];
  /** By name */
  boards: Board[];
  /** An exact key match first, then recently updated first */
  tasks: Task[];
}
