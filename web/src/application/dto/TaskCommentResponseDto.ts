import type { TaskComment } from "@/domain/models/TaskComment";

import type { UserResponseDto } from "./UserResponseDto";
import { mapUserToResponse } from "./UserResponseDto";

export interface TaskCommentResponseDto {
  id: number;
  text: string;
  author: UserResponseDto;
  createdAt: string;
  updatedAt?: string;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Maps a TaskComment domain entity to a TaskCommentResponseDto.
 *
 * Converts domain-level task comment data into a response DTO format suitable for API responses.
 * The function also determines user permissions (canEdit, canDelete) based on comment authorship.
 *
 * @param comment - The TaskComment domain entity to be mapped
 * @param currentUserId - Optional ID of the currently authenticated user, used to determine permissions
 * @returns A TaskCommentResponseDto object with serialized comment data and permission flags
 *
 * @example
 * ```typescript
 * const commentDto = mapTaskCommentToResponse(taskComment, 123);
 * // Returns: { id: 1, text: "...", author: {...}, createdAt: "...", updatedAt: "...", canEdit: true, canDelete: true }
 * ```
 */
export const mapTaskCommentToResponse = (
  comment: TaskComment,
  currentUserId?: number,
): TaskCommentResponseDto => {
  const isAuthor = currentUserId === Number(comment.author.id.value);

  return {
    id: Number(comment.id.value),
    text: comment.text,
    author: mapUserToResponse(comment.author),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt?.toISOString(),
    canEdit: isAuthor,
    canDelete: isAuthor,
  };
};

/**
 * Maps an array of TaskComment entities to an array of TaskCommentResponseDto objects.
 *
 * @param comments - Array of TaskComment entities to be mapped
 * @param currentUserId - Optional ID of the current user, used for determining user-specific properties in the response
 * @returns Array of TaskCommentResponseDto objects created from the input comments
 */
export const mapTaskCommentsToResponse = (
  comments: TaskComment[],
  currentUserId?: number,
): TaskCommentResponseDto[] =>
  comments.map((comment) => mapTaskCommentToResponse(comment, currentUserId));
