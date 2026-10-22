import z from "zod";

import { passwordField } from "@/presentation/shared/forms/fields";

export const schema = z
  .object({
    oldPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Подтвердите новый пароль"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "Новый пароль не должен совпадать с текущим",
    path: ["newPassword"],
  });

export type FormValues = z.infer<typeof schema>;
