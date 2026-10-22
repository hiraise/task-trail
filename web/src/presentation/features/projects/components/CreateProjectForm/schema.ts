import z from "zod";

import {
  projectDescriptionField,
  projectKeyField,
  projectNameField,
} from "@/presentation/shared/forms/fields";

export const CreateProjectSchema = z.object({
  name: projectNameField,
  description: projectDescriptionField,
  key: projectKeyField,
});

export type CreateProjectFormData = z.infer<typeof CreateProjectSchema>;
