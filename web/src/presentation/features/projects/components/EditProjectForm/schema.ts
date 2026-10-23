import z from "zod";

import {
  projectDescriptionField,
  projectKeyField,
  projectNameField,
} from "@/presentation/shared/forms/fields";

export const schema = z.object({
  name: projectNameField,
  description: projectDescriptionField,
  /** Only the owner sees the key field (canChangeProjectKey) */
  key: projectKeyField.optional(),
});

export type FormValues = z.infer<typeof schema>;
