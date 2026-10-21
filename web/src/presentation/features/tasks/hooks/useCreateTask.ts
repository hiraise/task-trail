import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreateTaskPayload } from "@/application/payloads";
import { createTaskUseCase } from "@/application/usecases";
import type { Task } from "@/domain/models/Task";
import { logger } from "@/infrastructure/config/clientLogger";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { useNavigate } from "@tanstack/react-router";

export function useCreateTask() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: (payload) => createTaskUseCase(payload),
    onSuccess: async (newTask) => {
      queryClient.setQueryData(QUERY_KEYS.task.detail(newTask.id), newTask);

      logger.info("Task created successfully", {
        taskId: newTask.id,
        name: newTask.name,
      });

      toast.success("Task created successfully");
      await new Promise((resolve) => setTimeout(resolve, 300));

      navigate({
        to: "/projects/$id/tasks/$taskId",
        params: { id: newTask.projectId, taskId: newTask.id },
      });
    },
    onError: () => {
      logger.error("Failed to create task", { timestamp: new Date().toISOString() });
      toast.error("Failed to create task. Please try again");
    },
    onSettled: (_, __, newTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.tasks(newTask.projectId) });
    },
  });
}
