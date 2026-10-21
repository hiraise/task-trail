import { z } from "zod";

import type { UserId } from "../types";

export const UserIdSchema = z
  .union([z.string(), z.number()])
  .transform(String) as z.ZodType<UserId>;

export const UserSchema = z.object({
  id: UserIdSchema,
  email: z.email(),
  username: z.string().optional().nullable(),
  // Сервер отдаёт null, пока аватарки нет; без nullish разбор падал, и вход возвращал на страницу логина
  avatarUrl: z
    .url()
    .nullish()
    .transform((value) => value ?? undefined),
});

export type User = z.infer<typeof UserSchema>;

export const createUser = (data: unknown): User => {
  return UserSchema.parse(data);
};

export const getUserDisplayName = (user: User): string => {
  return user.username?.trim() || user.email.split("@")[0] || "";
};
