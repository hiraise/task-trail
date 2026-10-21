import z from "zod";

export const schema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
});

export type FormData = z.infer<typeof schema>;
