"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import type { CreateTaskPayload } from "@/application/payloads";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to create a new task.
 *
 * This hook utilizes the `useMutation` from React Query to handle the task creation process.
 * It triggers the `createTask` use case and manages the success and error states.
 *
 * On successful task creation:
 * - Invalidates the queries related to the project's tasks to ensure the UI is up-to-date.
 * - Redirects the user to the newly created task's detail page.
 * - Displays a success toast notification.
 *
 * On error:
 * - Displays an error toast notification to inform the user of the failure.
 *
 * @returns {UseMutationResult<TaskResponseDto, Error, CreateTaskPayload>} The mutation result containing the status and methods to manage the mutation.
 */
export function useCreateTask(): UseMutationResult<TaskResponseDto, Error, CreateTaskPayload> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createTask } = appContainer.getUsecases().tasks;

  return useMutation({
    mutationFn: (payload) => createTask.execute(payload),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(newTask.projectId) });
      if (newTask) router.push(ROUTES.task(newTask.id));
      toast.success("Task created successfully");
    },
    onError: () => toast.error("Failed to create task. Please try again"),
  });
}
