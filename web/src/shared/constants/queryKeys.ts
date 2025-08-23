export const QUERY_KEYS = {
  tasks: ["tasks"] as const,
  task: (id: number | string) => ["task", id] as const,
  projects: ["projects"] as const,
};
