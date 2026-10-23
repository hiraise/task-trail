import type { ProjectId, ProjectRole } from "../types";

export interface Project {
  id: ProjectId;
  name: string;
  /** undefined when there is no description */
  description?: string;
  /** Upper-case, like DS, Cyrillic letters included; task keys are built from it (ADR-0026) */
  key: string;
  /** ISO 8601 in UTC; undefined when the project is active (ADR-0027) */
  archivedAt?: string;
  /** ISO 8601 in UTC */
  createdAt: string;
  /** ISO 8601 in UTC */
  updatedAt: string;
  /** Tasks not archived on their own */
  tasksCount: number;
}

/** An archived project is read-only together with its members and tasks (ADR-0027). */
export const isProjectArchived = (project: Project): boolean => project.archivedAt !== undefined;

/** A project and the current user's role in it. */
export interface ProjectDetails extends Project {
  role: ProjectRole;
}
