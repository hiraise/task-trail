import type { CommentId } from "../types";

import type { User } from "./User";

// Комментариев в API пока нет (этап 2, docs/roadmap.md): модель описывает заглушку экрана задачи.
export interface TaskComment {
  id: CommentId;
  author: User;
  createdAt: string;
  text: string;
  updatedAt?: string;
}
