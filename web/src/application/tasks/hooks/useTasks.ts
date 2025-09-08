import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { taskService } from "@/infrastructure/api/taskService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { TaskPayload } from "@/domain/task/task.payload";
import { ROUTES } from "@/infrastructure/config/routes";
import { Task } from "@/domain/task/task.entity";
import {
  useGetById,
  useGetProjectMembers,
  useGetProjectStatuses,
} from "@/application/projects/hooks/useProject";

export const useGetTask = () => {
  const params = useParams();
  const taskId = Number(params.id);

  return useQuery({
    queryKey: [QUERY_KEYS.task(taskId), taskId],
    queryFn: () => taskService.getTask(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTask = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<number, Error, TaskPayload>({
    mutationFn: taskService.create,
    onSuccess: (taskId, payload) => {
      router.push(ROUTES.task(taskId));
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(payload.projectId) });
    },
    onError: () => toast.error("Failed to create task"),
  });
};

export const useGetTaskInfo = (id: number) => {
  const queryClient = useQueryClient();
  const task = queryClient.getQueryData<Task>([QUERY_KEYS.task(id), id]);

  const { data: statuses } = useGetProjectStatuses(task!.projectId);
  const status = statuses?.find((s) => s.id === task?.statusId);

  const { data: members } = useGetProjectMembers(task!.projectId);
  const assignee = members?.find((m) => m.id === task?.assigneeId);

  const { data: project } = useGetById(task!.projectId);

  return {
    status,
    projectId: task?.projectId,
    assignee: assignee?.username ?? assignee?.email,
    project: project?.name ?? "",
  };
};
