import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

import { findTaskInLists } from "./taskCache";

export function useTask(taskId: TaskId) {
  const queryClient = useQueryClient();

  return useQuery<Task, Error>({
    queryKey: QUERY_KEYS.task.detail(taskId),
    queryFn: () => taskRepository.findById(taskId),
    enabled: !!taskId,
    // Пока задача грузится, показываем её из списка, откуда её открыли: проект и участники
    // начинают грузиться сразу, не дожидаясь ответа по задаче
    placeholderData: () => findTaskInLists(queryClient, taskId),
  });
}
