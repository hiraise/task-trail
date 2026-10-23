import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TaskComment } from "@/domain/models/TaskComment";
import type { CommentId, TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";

// After any comment change the list is refetched: the server decides order and contents.

export function useCreateComment(taskId: TaskId) {
  const queryClient = useQueryClient();

  return useMutation<TaskComment, Error, string>({
    mutationFn: (text) => taskRepository.createComment(taskId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.comments(taskId) }),
    onError: (error) => toastError(error, tasksTexts.comments.createFailed),
  });
}

export function useEditComment(taskId: TaskId) {
  const queryClient = useQueryClient();

  return useMutation<TaskComment, Error, { commentId: CommentId; text: string }>({
    mutationFn: ({ commentId, text }) => taskRepository.updateComment(taskId, commentId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.comments(taskId) }),
    onError: (error) => toastError(error, tasksTexts.comments.editFailed),
  });
}

export function useDeleteComment(taskId: TaskId) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CommentId>({
    mutationFn: (commentId) => taskRepository.deleteComment(taskId, commentId),
    onSuccess: () => {
      toast.success(tasksTexts.comments.deleted);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.comments(taskId) });
    },
    onError: (error) => toastError(error, tasksTexts.comments.deleteFailed),
  });
}
