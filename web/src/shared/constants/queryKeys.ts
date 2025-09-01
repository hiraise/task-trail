export const QUERY_KEYS = {
  auth: ["auth"] as const,
  user: ["user"] as const,
  tasks: ["tasks"] as const,
  task: (id: number) => ["task", id] as const,
  projects: ["projects"] as const,
  project: (projectId: number) => ["project", projectId] as const,
  projectTasks: (projectId: number) => ["tasks", "project", projectId] as const,
  projectStatuses: (projectId: number) => ["statuses", "project", projectId] as const,
  projectMembers: (projectId: number) => ["members", "project", projectId] as const,
  projectCandidates: (projectId?: number) =>
    projectId != null
      ? (["candidates", "project", projectId] as const)
      : (["candidates", "project"] as const),
};
