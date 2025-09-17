export const QUERY_KEYS = {
  auth: ["auth"] as const,
  currentUser: ["me"] as const,
  userTasks: ["me", "task"] as const,
  user: (id: number) => ["user", id] as const,
  tasks: ["tasks"] as const,
  task: (id: number) => ["task", id] as const,
  projects: ["projects"] as const,
  project: (id: number) => ["project", id] as const,
  projectTasks: (id: number) => ["tasks", "project", id] as const,
  projectStatuses: (id: number) => ["statuses", "project", id] as const,
  projectMembers: (id: number) => ["members", "project", id] as const,
  projectCandidates: (id?: number) =>
    id != null ? (["candidates", "project", id] as const) : (["candidates", "project"] as const),
};
