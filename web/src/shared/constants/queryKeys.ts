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
  auth: {
    session: ["auth", "session"] as const,
  },
  user: {
    current: ["user", "current"] as const,
    detail: (id: UserId) => ["user", id] as const,
  },
  task: {
    all: ["task"] as const,
    user: ["task", "user"] as const,
    detail: (id: TaskId) => ["task", id] as const,
  },
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
