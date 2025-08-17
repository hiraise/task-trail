import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Task, TaskStatus } from "@/domain/task/task.entity";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { update } from "../slices/taskSlice";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const useTask = () => {
  const params = useParams();
  const taskId = Number(params.id);

  const task = useAppSelector((s) => s.task) as Task | null;
  const dispatch = useAppDispatch();

  const changeStatus = (newStatus: TaskStatus) => {
    try {
      dispatch(update({ status: newStatus }));
      toast.success(`Task status changed to ${newStatus}`);
    } catch (error) {
      clientLogger.error("Failed to update task status", { error });
      toast.error("Failed to update task status");
    }
  };

  return { task, taskId, changeStatus };
};
