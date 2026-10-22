import z from "zod";

import { projectDescriptionField, projectNameField } from "@/presentation/shared/forms/fields";

export const CreateProjectSchema = z.object({
  name: projectNameField,
  description: projectDescriptionField,
});

export type CreateProjectFormData = z.infer<typeof CreateProjectSchema>;
