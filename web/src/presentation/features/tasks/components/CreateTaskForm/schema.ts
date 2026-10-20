import z from "zod";

import { tasksTexts } from "@/shared/locales/tasks";

export const CreateTaskSchema = z.object({
  name: z
    .string()
    .min(6, "Task name must be at least 6 characters")
    .max(100, "Task name must not exceed 100 characters"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
  projectId: z.string().min(1, tasksTexts.requiredField),
  assigneeId: z.string().optional(),
});

export type CreateTaskFormData = z.infer<typeof CreateTaskSchema>;
