import type { TaskComment } from "@/domain/models/TaskComment";

import type { UserResponseDto} from "./UserResponseDto";
import { UserResponseMapper } from "./UserResponseDto";

export interface TaskCommentResponseDto {
  id: number;
  text: string;
  author: UserResponseDto;
  createdAt: string;
  updatedAt?: string;
  canEdit: boolean;
  canDelete: boolean;
}

export class TaskCommentResponseMapper {
  static fromDomain(comment: TaskComment, currentUserId?: number): TaskCommentResponseDto {
    const isAuthor = currentUserId === Number(comment.author.id.value);

    return {
      id: Number(comment.id.value),
      text: comment.text,
      author: UserResponseMapper.fromDomain(comment.author),
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt?.toISOString(),
      canEdit: isAuthor,
      canDelete: isAuthor,
    };
  }

  static fromDomainList(comments: TaskComment[], currentUserId?: number): TaskCommentResponseDto[] {
    return comments.map((comment) => this.fromDomain(comment, currentUserId));
  }
}
