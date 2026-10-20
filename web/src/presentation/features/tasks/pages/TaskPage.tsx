import { DeviceBased } from "@/presentation/shared";
import type { TaskId } from "@/domain/types";

import { TaskDesktopPage, TaskMobilePage } from "./TaskDetailPage";
import { useGetTaskDetail } from "../hooks/useGetTaskDetail";

export function TaskPage({ taskId }: { taskId: TaskId }) {
  const { data } = useGetTaskDetail(taskId);

  if (!data) return null;

  const taskPageProps = { task: data.task };

  return (
    <DeviceBased
      desktop={<TaskDesktopPage {...taskPageProps} />}
      mobile={<TaskMobilePage {...taskPageProps} />}
    />
  );
}
