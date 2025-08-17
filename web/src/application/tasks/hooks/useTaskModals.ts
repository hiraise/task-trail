import { useTask } from "./useTask";
import { MODAL_TYPE, useTaskModal } from "@/app/tasks/TaskModalContext";
import { TaskStatus } from "@/domain/task/task.entity";
import { MembersData } from "@/presentation/widgets/projects/MembersList/MembersList.mock";

export const useTaskModals = () => {
  const { task, changeStatus, selectAssignee } = useTask();
  const { open } = useTaskModal();

  const showChangeSatus = async (): Promise<void> => {
    try {
      const newStatus = await open<TaskStatus>(MODAL_TYPE.CHANGE_STATUS);
      if (task && newStatus === task.status) return;
      changeStatus(newStatus);
    } catch {
      return;
    }
  };

  const showSelectAssignee = async (): Promise<void> => {
    try {
      const assignee = await open<MembersData>(MODAL_TYPE.SELECT_ASSIGNEE);
      if (assignee) selectAssignee(assignee);
    } catch {
      return;
    }
  };

  const showSortTasks = async (): Promise<void> => {
    try {
      await open(MODAL_TYPE.SORT_TASKS);
    } catch {
      return;
    }
  };

  const showCreateTask = async (): Promise<void> => {
    try {
      await open(MODAL_TYPE.CREATE_TASK);
    } catch {
      return;
    }
  };

  return { showChangeSatus, showSelectAssignee, showSortTasks, showCreateTask };
};
