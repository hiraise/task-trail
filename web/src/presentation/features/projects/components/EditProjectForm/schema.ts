import z from "zod";

import { projectDescriptionField, projectNameField } from "@/presentation/shared/forms/fields";

export const schema = z.object({
  name: projectNameField,
  description: projectDescriptionField,
});

export type FormValues = z.infer<typeof schema>;
