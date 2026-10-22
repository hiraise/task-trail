import z from "zod";

import { taskDescriptionField, taskNameField } from "@/presentation/shared/forms/fields";
import { tasksTexts } from "@/shared/locales/tasks";

// Ответственный необязателен, как в контракте (CreateTaskRequest): его можно назначить позже
export const CreateTaskSchema = z.object({
  name: taskNameField,
  description: taskDescriptionField,
  projectId: z.string().min(1, tasksTexts.requiredField),
});

export type CreateTaskFormData = z.infer<typeof CreateTaskSchema>;
