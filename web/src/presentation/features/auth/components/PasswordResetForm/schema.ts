import z from "zod";

const passwordSchema = z
  .string()
  .min(8, "Пароль должен содержать не менее 8 символов")
  .max(64, "Пароль должен содержать не более 64 символов")
  .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
  .regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
  .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру");

export const PasswordResetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type PasswordResetFormData = z.infer<typeof PasswordResetSchema>;
