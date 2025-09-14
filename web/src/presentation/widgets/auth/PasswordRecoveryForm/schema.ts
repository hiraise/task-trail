import z from "zod";

export const schema = z.object({
  email: z.email("Введите корректный email"),
});

export type FormData = z.infer<typeof schema>;
