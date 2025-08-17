import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Task, TaskStatus } from "@/domain/task/task.entity";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { update } from "../slices/taskSlice";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { MembersData } from "@/presentation/widgets/projects/MembersList/MembersList.mock";

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

  const selectAssignee = (assignee: MembersData) => {
    try {
      dispatch(update({ assigneeId: assignee.id }));
      toast.success(`Assignee changed to ${assignee.username}`);
    } catch (error) {
      clientLogger.error("Failed to change task assignee", { error });
      toast.error("Failed to change task assignee");
    }
  };

  return { task, taskId, changeStatus, selectAssignee };
};
