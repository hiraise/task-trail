import type { ProjectId, ProjectRole } from "../types";

export interface Project {
  id: ProjectId;
  name: string;
  /** Описания нет — undefined */
  description?: string;
  /** ISO 8601 в UTC */
  createdAt: string;
  tasksCount: number;
}

/** Проект и роль текущего пользователя в нём. */
export interface ProjectDetails extends Project {
  role: ProjectRole;
}
