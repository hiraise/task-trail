import z from "zod";

import { usernameField } from "@/presentation/shared/forms/fields";

export const PersonalDataSchema = z.object({
  username: usernameField,
});

export type PersonalDataFormData = z.infer<typeof PersonalDataSchema>;
