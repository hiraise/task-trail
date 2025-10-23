import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EditTaskPayload } from "@/domain/task/task.payload";
import { taskService } from "@/infrastructure/api/taskService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useEditTask = () => {
  const params = useParams();
  const taskId = Number(params.taskId);

  const queryClient = useQueryClient();
  return useMutation<void, Error, EditTaskPayload>({
    mutationFn: (payload) => taskService.editTask(taskId, payload),
    onSuccess: () => {
      toast.success("Task updated successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
    },
    onError: () => toast.error("Failed to change task"),
  });
};
