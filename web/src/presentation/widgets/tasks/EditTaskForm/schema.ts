import z from "zod";

export const schema = z.object({
  title: z.string().trim().min(8, "Название должно содержать минимум 8 символов"),
  description: z.string().trim(),
});

export type FormValues = z.infer<typeof schema>;
