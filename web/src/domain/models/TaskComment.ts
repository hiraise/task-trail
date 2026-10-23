import type { CommentId, TaskId } from "../types";

import type { User } from "./User";

/** How long after creation the author may edit a comment (ADR-0028). The server decides; the web hides the menu item. */
export const COMMENT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** A plain-text task comment (ADR-0028). */
export interface TaskComment {
  id: CommentId;
  taskId: TaskId;
  /** Shown even if the author has left the project */
  author: User;
  text: string;
  /** ISO 8601 in UTC */
  createdAt: string;
  /** ISO 8601 in UTC; undefined when never edited */
  editedAt?: string;
}

/** The comment can still be edited at `now`: less than 24 hours since it was written. */
export const isCommentEditable = (comment: TaskComment, now: number = Date.now()): boolean =>
  now < Date.parse(comment.createdAt) + COMMENT_EDIT_WINDOW_MS;
