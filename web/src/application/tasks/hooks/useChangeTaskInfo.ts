import { toast } from "sonner";

import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useGetTaskInfo } from "./useTasks";
import { Task } from "@/domain/task/task.entity";
import { useChangeStatus } from "./useChangeStatus";
import { useChangeAssignee } from "./useChangeAssignee";

export const useChangeTaskInfo = (task: Task) => {
  const { showChangeStatus, showSelectAssignee, showSelectProject } = useGlobalModals();
  const { status, projectId, assignee, project } = useGetTaskInfo(task.id);

  const { mutateAsync: mutateStatus } = useChangeStatus();
  const { mutateAsync: changeAssignee } = useChangeAssignee();

  /**
   * Prompts the user to select a new status for the current task.
   * If the user selects a different status, updates the task's status accordingly.
   *
   * @async
   * @function
   * @returns {Promise<void>} A promise that resolves when the status change operation is complete.
   *
   * @remarks
   * - Uses `showChangeStatus` to display a status selection dialog.
   * - If the selected status is the same as the current one or the dialog is cancelled, no update occurs.
   * - Calls `mutateStatus` to persist the status change.
   */
  const changeStatus = async () => {
    const result = await showChangeStatus({ currentStatus: status, projectId: projectId });
    if (!result || result.id === status?.id) return;
    await mutateStatus({ id: task.id, statusId: result.id });
  };

  const selectProject = async () => {
    const result = await showSelectProject(task.projectId);
    if (!result) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Select project with id: ${result.id}`);
  };

  /**
   * Opens a dialog to select a new assignee for the current task.
   *
   * This function displays a selection UI for choosing an assignee, pre-selecting the current assignee.
   * If a new assignee is selected, it waits for 1.5 seconds (simulating an async operation)
   * and then shows a success toast notification with the selected assignee's ID.
   *
   * @async
   * @returns {Promise<void>} Resolves when the selection and notification are complete.
   */
  const selectAssignee = async () => {
    const result = await showSelectAssignee({
      userId: task.assigneeId,
      projectId: task.projectId,
    });
    //TODO: Also handle remove assignee case
    if (!result) return;
    await changeAssignee({ id: task.id, assigneeId: result.id });
  };

  return { status, assignee, project, changeStatus, selectProject, selectAssignee };
};
