import z from "zod";

import { taskDescriptionField, taskNameField } from "@/presentation/shared/forms/fields";

export const schema = z.object({
  name: taskNameField,
  description: taskDescriptionField,
});

export type FormValues = z.infer<typeof schema>;
