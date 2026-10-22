import type { CommentId } from "../types";

import type { User } from "./User";

// The API has no comments yet (stage 2, docs/roadmap.md): the model describes the task screen placeholder.
export interface TaskComment {
  id: CommentId;
  author: User;
  createdAt: string;
  text: string;
  updatedAt?: string;
}
