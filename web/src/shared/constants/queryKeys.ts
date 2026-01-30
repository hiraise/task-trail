import type { ProjectId, TaskId, UserId } from "../../domain/types";

export const QUERY_KEYS = {
  auth: ["auth"] as const,
  currentUser: ["me"] as const,
  userTasks: ["me", "task"] as const,
  user: (id: UserId) => ["user", id] as const,
  tasks: ["tasks"] as const,
  task: (id: TaskId) => ["task", id] as const,
  taskDetails: (id: TaskId) => ["taskDetails", id] as const,
  projects: ["projects"] as const,
  project: (id: ProjectId) => ["project", id] as const,
  projectDetails: (id: ProjectId) => ["projectDetails", id] as const,
  projectTasks: (id: ProjectId) => ["tasks", "project", id] as const,
  projectStatuses: (id: ProjectId) => ["statuses", "project", id] as const,
  projectMembers: (id: ProjectId) => ["members", "project", id] as const,
  projectCandidates: (id?: ProjectId) =>
    id != null ? (["candidates", "project", id] as const) : (["candidates", "project"] as const),
};
