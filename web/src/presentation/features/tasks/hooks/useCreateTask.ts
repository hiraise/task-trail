"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CreateTaskPayload } from "@/application/payloads";
import { createTaskUseCase } from "@/application/usecases";
import type { Task } from "@/domain/models/Task";
import { logger } from "@/infrastructure/config/clientLogger";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useCreateTask() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: (payload) => createTaskUseCase(payload),
    onSuccess: async (newTask) => {
      queryClient.setQueryData(QUERY_KEYS.taskDetails(newTask.id), newTask);

      logger.info("Task created successfully", {
        taskId: newTask.id,
        name: newTask.name,
      });

      toast.success("Task created successfully");
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(ROUTES.task(newTask.id));
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
