import type { TaskCommentId } from "../valueobjects/TaskCommentId";
import type { UserId } from "../valueobjects/UserId";

import type { User } from "./User";

export class TaskComment {
  constructor(
    public readonly id: TaskCommentId,
    public readonly author: User,
    public readonly createdAt: Date,
    public text: string,
    public readonly updatedAt?: Date,
  ) {}

  updateText(newText: string, updatedBy: UserId): void {
    if (!this.author.id.equals(updatedBy)) {
      throw new Error("Only author can edit comment");
    }
    this.text = newText;
  }
}
