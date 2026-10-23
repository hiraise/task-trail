import type { Task } from "@/domain/models/Task";

/**
 * Tasks the task may be attached to (ADR-0036): active ones of its project, not itself and not
 * subtasks — one level. A task with subtasks is not attached at all. `query` matches the key or name.
 */
export function parentCandidates(tasks: Task[], task: Task, query: string): Task[] {
  if (task.subtasksTotal > 0) return [];

  const needle = query.trim().toLowerCase();

  return tasks.filter(
    (candidate) =>
      candidate.id !== task.id &&
      !candidate.parentId &&
      !candidate.archivedAt &&
      (candidate.key.toLowerCase().includes(needle) || candidate.name.toLowerCase().includes(needle)),
  );
}
