import type { ProjectId, TaskId, UserId } from "../../domain/types";

/**
 * Cache key strategy:
 *
 * 1. Hierarchy: ["entity", "identifier", "sub-entity", "parameters"]
 * 2. Grouping: all entity data under a single prefix
 * 3. Invalidation: easy to invalidate entire group or parts of it
 *
 * Examples:
 * - ["project", "123"] → all data for project 123
 * - ["project", "123", "tasks"] → tasks for project 123
 * - ["project", "123", "members"] → members of project 123
 */

export const QUERY_KEYS = {
  auth: ["auth"] as const,
  currentUser: ["me"] as const,
  userTasks: ["me", "task"] as const,
  user: (id: UserId) => ["user", id] as const,
  tasks: ["tasks"] as const,
  task: (id: TaskId) => ["task", id] as const,
  taskDetails: (id: TaskId) => ["taskDetails", id] as const,
  project: {
    all: ["project", "all"] as const,
    detail: (id: ProjectId) => ["project", id] as const,
    tasks: (id: ProjectId) => ["project", id, "tasks"] as const,
    statuses: (id: ProjectId) => ["project", id, "statuses"] as const,
    members: (id: ProjectId) => ["project", id, "members"] as const,
    candidates: {
      all: ["project", "candidates"] as const,
      byProject: (id: ProjectId) => ["project", id, "candidates"] as const,
    },
  },
  invalidate: {
    project: (projectId: ProjectId) => ["project", projectId] as const,
    task: (taskId: TaskId) => ["task", taskId] as const,
    user: (userId: UserId) => ["user", userId] as const,
  },
};
