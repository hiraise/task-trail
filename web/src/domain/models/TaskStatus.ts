import z from "zod";

import type { TaskStatusId } from "../types";

export const TaskStatusIdSchema = z
  .union([z.string(), z.number()])
  .transform(String) as z.ZodType<TaskStatusId>;

export const TaskStatusSchema = z.object({
  id: TaskStatusIdSchema,
  name: z.string(),
  isDefault: z.boolean(),
  isResolved: z.boolean(),
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const createTaskStatus = (raw: unknown): TaskStatus => {
  return TaskStatusSchema.parse(raw);
};
