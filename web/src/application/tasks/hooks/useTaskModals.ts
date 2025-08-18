import { useNewTask } from "@/app/tasks/NexTaskContext";
import { useTask } from "./useTask";
import { MODAL_TYPE, useTaskModal } from "@/app/tasks/TaskModalContext";
import { TaskStatus } from "@/domain/task/task.entity";
import { MembersData } from "@/presentation/widgets/projects/MembersList/MembersList.mock";
import { Project } from "@/domain/project/project.entity";

export const useTaskModals = () => {
  const { task, changeStatus, selectAssignee } = useTask();
  const { open } = useTaskModal();
  const { setFields, ...formValues } = useNewTask();

  const showChangeSatus = async (): Promise<void> => {
    try {
      const newStatus = await open<TaskStatus>(MODAL_TYPE.CHANGE_STATUS);
      if (task && newStatus === task.status) return;
      changeStatus(newStatus);
    } catch {
      return;
    }
  };

  const showSelectAssignee = async (userId?: number): Promise<MembersData | undefined> => {
    try {
      const assignee = await open<MembersData>(MODAL_TYPE.SELECT_ASSIGNEE, { userId });
      // Temporary solution with sending seleted user to context
      // This should be replaced with a more robust state management solution
      if (assignee && formValues.assignee === assignee.username) return;
      if (assignee) selectAssignee(assignee);
      setFields({ assignee: assignee.username || assignee.email });
      return assignee;
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

  const showSelectProject = async (projectId?: number): Promise<Project | undefined> => {
    try {
      const project = await open<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId });
      // Temporary solution with sending selected project to context
      // This should be replaced with a more robust state management solution
      if (formValues.project === project.name) return;
      if (project) setFields({ project: project.name });
      return project;
    } catch {
      return;
    }
  };

  return { showChangeSatus, showSelectAssignee, showSortTasks, showCreateTask, showSelectProject };
};
