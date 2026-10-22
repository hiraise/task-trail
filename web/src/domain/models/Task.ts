import { z } from "zod";

import type { ProjectId, TaskId, UserId } from "../types";

import { TaskStatusIdSchema } from "./TaskStatus";

const ProjectIdSchema = z.union([z.string(), z.number()]).transform(String) as z.ZodType<ProjectId>;
const UserIdSchema = z.union([z.string(), z.number()]).transform(String) as z.ZodType<UserId>;

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
