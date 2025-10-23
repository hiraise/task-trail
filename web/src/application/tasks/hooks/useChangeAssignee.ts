import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { taskService } from "@/infrastructure/api/taskService";
import { ChangeAssigneePayload } from "@/domain/task/task.payload";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useChangeAssignee = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ChangeAssigneePayload>({
    mutationFn: taskService.changeAssignee,

    onSuccess: (taskId, payload) => {
      toast.success("Assignee updated successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(payload.id) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.task(payload.id), payload.id] });
    },
    onError: () => toast.error("Failed to change assignee"),
  });
};
