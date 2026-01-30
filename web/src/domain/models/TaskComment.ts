import z from "zod";

import type { CommentId } from "../types";

import { UserSchema } from "./User";

export const TaskCommentSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).pipe(z.string()) as z.ZodType<CommentId>,
  author: UserSchema,
  createdAt: z.iso.datetime(),
  text: z.string(),
  updatedAt: z.iso.datetime().optional(),
});

export type TaskComment = z.infer<typeof TaskCommentSchema>;
