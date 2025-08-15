import { useParams } from "next/navigation";

import { mockTasks } from "@/presentation/widgets/tasks/TaskList";
import { AppError, AppErrorType } from "@/shared/errors/types";

export const useTask = () => {
  const params = useParams();
  const taskId = Number(params.id);

  const task = mockTasks.find((task) => task.id === taskId);
  if (!task) throw new AppError(AppErrorType.SERVER, "Task not found");

  return { task };
};
