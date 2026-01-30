import { toast } from "sonner";

import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import type { Task } from "@/domain/models/Task";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useChangeAssignee } from "./useChangeAssignee";
import { useChangeStatus } from "./useChangeStatus";
import { useGetTaskDetail } from "./useGetTaskDetail";

export const useChangeTaskInfo = (
  task: Task,
): {
  data: TaskDetailResponseDto | undefined;
  changeStatus: () => Promise<void>;
  selectProject: () => Promise<void>;
  selectAssignee: () => Promise<void>;
} => {
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
      projectId: extendedTask.project.id,
    });
    if (!result || result.id === extendedTask.status?.id) return;
    await mutateStatus({ taskId: task.id, statusId: result.id });
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
    await changeAssignee({ taskId: task.id, assigneeId: result.id });
  };

  return { data: extendedTask ?? undefined, changeStatus, selectProject, selectAssignee };
};
