import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { TaskStatus } from "@/domain/task/task.entity";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { update } from "../slices/taskSlice";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { MembersData } from "@/presentation/widgets/projects/MembersList/MembersList.mock";
import { Project } from "@/domain/project/project.entity";
import { errorTexts } from "@/shared/locales/messages";
import { handleAsyncAction } from "@/shared/utils/handleAsyncAction";
import { ROUTES } from "@/infrastructure/config/routes";
import { selectTask } from "../slices/taskSelectors";
import { TaskPayload } from "@/domain/task/task.payload";
import * as api from "@/infrastructure/adapters/tasksApi";

export const useTask = () => {
  const router = useRouter();
  const params = useParams();
  const taskId = Number(params.id);

  const dispatch = useAppDispatch();
  const task = useAppSelector(selectTask);
  const [isLoading, setIsLoading] = useState(false);

  // Define hooks for API interactions
  const [createMutation] = api.useCreateMutation();

  /**
   * Creates a new task in the specified project.
   * @function create
   * @param {TaskPayload} payload - The arguments containing `projectId` (ID of the project), `name` (task title), `description` (task details), and other optional task properties.
   * @returns {void} - Returns nothing. Navigates to the created task's project page and shows a success toast on success.
   * @sideEffects Navigates, shows toast, updates loading state.
   */
  const create = (payload: TaskPayload) =>
    handleAsyncAction<void>({
      action: async () => {
        const task = await createMutation(payload).unwrap();
        if (task) router.push(ROUTES.project(task.id.toString()));
        toast.success("Task created successfully");
      },
      setIsLoading,
      errorMessage: "Failed to create task",
    });

  const changeStatus = async (newStatus: TaskStatus) => {
    setIsLoading(true);
    try {
      if (task.status === newStatus) return;
      dispatch(update({ status: newStatus }));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Task status changed to ${newStatus}`);
    } catch (error) {
      clientLogger.error("Failed to update task status", { error });
      toast.error("Failed to update task status");
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      if (task.assigneeId && task.assigneeId === assignee.id) return;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      dispatch(update({ assigneeId: assignee.id }));
      toast.success("Assignee was successfully changed");
    } catch (error) {
      clientLogger.error(`Fail to change assignee for task ${task.id}`, { error });
      toast.error(errorTexts.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  const changeProject = async (project: Project) => {
    setIsLoading(true);
    try {
      if (task.projectId === project.id) return;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      dispatch(update({ projectId: project.id }));
      toast.success("Project was successfully changed");
    } catch (error) {
      clientLogger.error(`Fail to change project for task: ${task.id}`, { error });
      toast.error(errorTexts.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    task,
    taskId,
    changeStatus,
    selectAssignee,
    changeAssignee,
    changeProject,
    create,
  };
};
