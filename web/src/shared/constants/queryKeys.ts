export const QUERY_KEYS = {
  tasks: ["tasks"] as const,
  task: (id: number | string) => ["task", id] as const,
  projectTasks: (projectId: number | string) => ["tasks", "project", projectId] as const,
  projects: ["projects"] as const,
};
