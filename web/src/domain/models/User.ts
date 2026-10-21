import { z } from "zod";

import type { UserId } from "../types";

export const UserIdSchema = z
  .union([z.string(), z.number()])
  .transform(String) as z.ZodType<UserId>;

export const UserSchema = z.object({
  id: UserIdSchema,
  email: z.email(),
  username: z.string().optional().nullable(),
  avatarUrl: z.url().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const createUser = (data: unknown): User => {
  return UserSchema.parse(data);
};

export const getUserDisplayName = (user: User): string => {
  return user.username?.trim() || user.email.split("@")[0] || "";
};
