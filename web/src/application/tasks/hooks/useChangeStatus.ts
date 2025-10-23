import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { taskService } from "@/infrastructure/api/taskService";
import { ChangeStatusPayload } from "@/domain/task/task.payload";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useChangeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ChangeStatusPayload>({
    mutationFn: taskService.changeStatus,

    onSuccess: (taskId, payload) => {
      toast.success("Task status updated successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(payload.id) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.task(payload.id), payload.id] });
    },
    onError: () => toast.error("Failed to update status"),
  });
};
