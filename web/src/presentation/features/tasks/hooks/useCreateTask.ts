"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CreateTaskCommand } from "@/application/commands/task/CreateTaskCommand";
import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useCreateTask(): UseMutationResult<TaskResponseDto, Error, CreateTaskCommand> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createTask } = appContainer.getUsecases().tasks;

  return useMutation({
    mutationFn: (command) => createTask.execute(command),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(newTask.projectId) });
      if (newTask) router.push(ROUTES.task(newTask.id));
      toast.success("Task created successfully");
    },
    onError: () => toast.error("Failed to create task. Please try again"),
  });
}
