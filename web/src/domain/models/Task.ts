import { z } from "zod";

import type { TaskId, UserId } from "../types";

import { ProjectIdSchema } from "./Project";
import { TaskStatusIdSchema } from "./TaskStatus";
import { UserIdSchema } from "./User";

export const TaskSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String) as z.ZodType<TaskId>,
  name: z.string(),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  statusId: TaskStatusIdSchema,
  createdAt: z.iso.datetime(), // ISO 8601 строка
  updatedAt: z.iso.datetime(), // ISO 8601 строка
  projectId: ProjectIdSchema,
  authorId: UserIdSchema,
  assigneeId: z
    .union([z.string(), z.number(), z.null()])
    .transform((v) => (v === null ? undefined : String(v)))
    .optional() as z.ZodType<UserId | undefined>,
});

export type Task = z.infer<typeof TaskSchema>;

export const createTask = (raw: unknown): Task => {
  return TaskSchema.parse(raw);
};
