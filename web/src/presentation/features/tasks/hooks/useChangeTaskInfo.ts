import { toast } from "sonner";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useChangeAssignee } from "./useChangeAssignee";
import { useChangeStatus } from "./useChangeStatus";
import { useGetTaskDetail } from "./useGetTaskDetail";

/**
 * Custom hook for managing and updating task information, including status, assignee, and project selection.
 *
 * Provides asynchronous functions to:
 * - Change the status of a task via a modal dialog.
 * - Select a new project for the task.
 * - Select or change the assignee of the task via a modal dialog.
 *
 * @param {TaskResponseDto} task - The task object to operate on.
 * @returns {{
 *   data: TaskResponseDto | undefined,
 *   changeStatus: () => Promise<void>,
 *   selectProject: () => Promise<void>,
 *   selectAssignee: () => Promise<void>
 * }} An object containing the extended task data and functions to change status, project, and assignee.
 *
 * @remarks
 * - Uses global modal dialogs for user interactions.
 * - Handles asynchronous updates to the task via mutation hooks.
 * - The assignee removal case is not yet implemented.
 */
export const useChangeTaskInfo = (task: TaskResponseDto) => {
  const { showChangeStatus, showSelectAssignee, showSelectProject } = useGlobalModals();
  const { data: extendedTask } = useGetTaskDetail(task.id);
  const { mutateAsync: mutateStatus } = useChangeStatus();
  const { mutateAsync: changeAssignee } = useChangeAssignee();

  /**
   * Asynchronously prompts the user to change the status of the current task.
   *
   * - Opens a status change dialog with the current status and project ID.
   * - If the user selects a new status (different from the current one), updates the task's status.
   * - Does nothing if the user cancels or selects the same status.
   *
   * @returns {Promise<void>} A promise that resolves when the status change operation is complete.
   */
  const changeStatus = async (): Promise<void> => {
    if (!extendedTask) return;
    const result = await showChangeStatus({
      currentStatus: extendedTask.status,
      projectId: Number(extendedTask.project.id),
    });
    if (!result || result.id === extendedTask.status?.id) return;
    await mutateStatus({ taskId: task.id, statusId: Number(result.id) });
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
   * Invokes the `showSelectAssignee` function with the current task's assignee and project IDs.
   * If a new assignee is selected, updates the task's assignee using `changeAssignee`.
   *
   * @remarks
   * - If the selection is cancelled or no result is returned, the function exits early.
   * - The case for removing an assignee is not yet handled (see TODO).
   *
   * @returns A promise that resolves when the assignee change operation is complete.
   */
  const selectAssignee = async (): Promise<void> => {
    const result = await showSelectAssignee({
      userId: task.assigneeId,
      projectId: task.projectId,
    });
    //TODO: Also handle remove assignee case
    if (!result) return;
    await changeAssignee({ taskId: task.id, assigneeId: Number(result.id) });
  };

  return { data: extendedTask, changeStatus, selectProject, selectAssignee };
};
