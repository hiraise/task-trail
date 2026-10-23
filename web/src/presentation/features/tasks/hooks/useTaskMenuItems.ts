import { isTaskArchived, type Task } from "@/domain/models/Task";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";

import { useChangeTaskParent } from "./useChangeTaskParent";
import { useDeleteTask } from "./useDeleteTask";
import { useSetTaskArchived } from "./useSetTaskArchived";

/**
 * Task actions: any member of the task's project edits, archives and deletes it (API contract).
 * An archived task is only restored or deleted; a task of an archived project has no actions
 * (ADR-0027).
 */
export const useTaskMenuItems = (task?: Task) => {
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: setArchived } = useSetTaskArchived();
  const { mutate: changeParent } = useChangeTaskParent();
  const { showEditTask, showMoveToArchive, showDeleteItem, showSelectParent } = useGlobalModals();

  if (!task || task.projectArchived) return { menuItems: [] };

  const archived = isTaskArchived(task);
  const menuItems: MenuItem[] = [
    {
      label: TEXTS.tasks.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: () => showEditTask(task),
      isVisible: !archived,
    },
    {
      // One level (ADR-0036). subtasksTotal skips archived subtasks: for a task with only archived
      // ones the server answers 422 TASK_PARENT_INVALID, and the toast shows its text
      label: tasksTexts.makeSubtask,
      icon: ICONS.subtasks,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const parent = await showSelectParent({ projectId: task.projectId, taskId: task.id });

        if (parent) changeParent({ taskId: task.id, parentId: parent.id });
      },
      isVisible: !archived && !task.parentId && task.subtasksTotal === 0,
    },
    {
      label: tasksTexts.detachFromParent,
      icon: ICONS.subtasks,
      color: "var(--icon-tertiary)",
      onClick: () => changeParent({ taskId: task.id, parentId: null }),
      isVisible: !archived && !!task.parentId,
    },
    {
      label: TEXTS.tasks.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const confirmed = await showMoveToArchive({ type: "task", id: task.id, title: task.name });

        if (confirmed) setArchived({ taskId: task.id, archived: true });
      },
      isVisible: !archived,
    },
    {
      // Restoring needs no confirmation: it is undone by archiving again
      label: tasksTexts.restore,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: () => setArchived({ taskId: task.id, archived: false }),
      isVisible: archived,
    },
    {
      label: TEXTS.tasks.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        const result = await showDeleteItem({ type: "task", id: task.id, title: task.name });

        if (result) deleteTask(task);
      },
      isVisible: true,
    },
  ];

  return { menuItems: menuItems.filter((item) => item.isVisible) };
};
