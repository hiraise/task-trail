import type { BoardId, ProjectId, TaskId, UserId } from "../../domain/types";

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
    invitation: (token: string) => ["auth", "invitation", token] as const,
  },
  settings: {
    public: ["settings", "public"] as const,
  },
  /** Service admin section (ADR-0014) */
  admin: {
    settings: ["admin", "settings"] as const,
    users: ["admin", "users"] as const,
  },
  user: {
    current: ["user", "current"] as const,
    detail: (id: UserId) => ["user", id] as const,
  },
  task: {
    all: ["task"] as const,
    /** Both lists of tasks assigned to the current user — a prefix for invalidation */
    mineLists: ["task", "mine"] as const,
    /** Tasks assigned to the current user: active or archived (ADR-0027) */
    mine: (archived: boolean) => ["task", "mine", archived] as const,
    detail: (id: TaskId) => ["task", id] as const,
    /** The task feed (ADR-0028): comments and history, under the task's prefix */
    comments: (id: TaskId) => ["task", id, "comments"] as const,
    events: (id: TaskId) => ["task", id, "events"] as const,
    /** The task's subtasks (ADR-0036), under the task's prefix */
    subtasks: (id: TaskId) => ["task", id, "subtasks"] as const,
    /** The task's attachments (ADR-0037), under the task's prefix */
    attachments: (id: TaskId) => ["task", id, "attachments"] as const,
    /** Task statuses: one set shared by all projects */
    statuses: ["task-statuses"] as const,
  },
  project: {
    /** Both project lists — a prefix for invalidation */
    lists: ["project", "all"] as const,
    /** Active or archived projects (ADR-0027) */
    list: (archived: boolean) => ["project", "all", archived] as const,
    detail: (id: ProjectId) => ["project", id] as const,
    /** Both task lists of the project — a prefix for invalidation */
    taskLists: (id: ProjectId) => ["project", id, "tasks"] as const,
    /** The project's tasks by their own archive flag */
    tasks: (id: ProjectId, archived: boolean) => ["project", id, "tasks", archived] as const,
    members: (id: ProjectId) => ["project", id, "members"] as const,
    /** Project labels (ADR-0035) */
    labels: (id: ProjectId) => ["project", id, "labels"] as const,
    candidates: {
      all: ["project", "candidates"] as const,
      byProject: (id: ProjectId) => ["project", id, "candidates"] as const,
    },
  },
  /** Boards (ADR-0029): they show tasks and projects, so task and project changes refetch the prefix */
  board: {
    prefix: ["board"] as const,
    all: ["board", "all"] as const,
    detail: (id: BoardId) => ["board", id] as const,
    tasks: (id: BoardId) => ["board", id, "tasks"] as const,
  },
  /** Search results (ADR-0030): not invalidated, they are refetched each time the page opens */
  search: (q: string) => ["search", q] as const,
  invalidate: {
    project: (projectId: ProjectId) => ["project", projectId] as const,
    task: (taskId: TaskId) => ["task", taskId] as const,
    user: (userId: UserId) => ["user", userId] as const,
  },
};
