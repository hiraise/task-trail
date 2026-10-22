import z from "zod";

import { taskDescriptionField, taskNameField } from "@/presentation/shared/forms/fields";
import { tasksTexts } from "@/shared/locales/tasks";

// The assignee is optional, as in the contract (CreateTaskRequest): it can be set later
export const CreateTaskSchema = z.object({
  name: taskNameField,
  description: taskDescriptionField,
  projectId: z.string().min(1, tasksTexts.requiredField),
});

export type CreateTaskFormData = z.infer<typeof CreateTaskSchema>;
