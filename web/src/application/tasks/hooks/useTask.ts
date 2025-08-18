import { useParams } from "next/navigation";
import { toast } from "sonner";

import { TaskStatus } from "@/domain/task/task.entity";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { update } from "../slices/taskSlice";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { MembersData } from "@/presentation/widgets/projects/MembersList/MembersList.mock";
import { Project } from "@/domain/project/project.entity";
import { errorTexts } from "@/shared/locales/messages";

export const useTask = () => {
  const params = useParams();
  const taskId = Number(params.id);

  const task = useAppSelector((s) => s.task);
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
    } catch (error) {
      clientLogger.error("Failed to change task assignee", { error });
      toast.error("Failed to change task assignee");
    }
  };

  const changeAssignee = async (assignee: MembersData) => {
    try {
      if (task.assigneeId && task.assigneeId === assignee.id) return;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      dispatch(update({ assigneeId: assignee.id }));
      toast.success("Assignee was successfully changed");
    } catch (error) {
      clientLogger.error(`Fail to change assignee for task ${task.id}`, { error });
      toast.error(errorTexts.somethingWentWrong);
    }
  };

  const changeProject = async (project: Project) => {
    try {
      if (task.projectId === project.id) return;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      dispatch(update({ projectId: project.id }));
      toast.success("Project was successfully changed");
    } catch (error) {
      clientLogger.error(`Fail to change project for task: ${task.id}`, { error });
      toast.error(errorTexts.somethingWentWrong);
    }
  };

  return { task, taskId, changeStatus, selectAssignee, changeAssignee, changeProject };
};
