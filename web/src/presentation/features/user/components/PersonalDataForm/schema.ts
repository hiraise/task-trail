import z from "zod";

export const schema = z.object({
  username: z.string().trim().min(1, "Поле не может быть пустым"),
  email: z.email("Введите корректный email").optional(),
});

export type FormValues = z.infer<typeof schema>;
