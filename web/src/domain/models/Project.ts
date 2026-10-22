import type { ProjectId, ProjectRole } from "../types";

export interface Project {
  id: ProjectId;
  name: string;
  /** undefined when there is no description */
  description?: string;
  /** ISO 8601 in UTC */
  createdAt: string;
  tasksCount: number;
}

/** A project and the current user's role in it. */
export interface ProjectDetails extends Project {
  role: ProjectRole;
}
