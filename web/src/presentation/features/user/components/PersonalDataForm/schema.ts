import z from "zod";

export const PersonalDataSchema = z.object({
  username: z.string().trim().min(1, "Поле не может быть пустым"),
  email: z.email("Введите корректный email").optional(),
});

export type PersonalDataFormData = z.infer<typeof PersonalDataSchema>;
