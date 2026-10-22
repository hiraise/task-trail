import { toast } from "sonner";

import type { Task } from "@/domain/models/Task";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { useProject } from "../../projects/hooks";

import { useDeleteTask } from "./useDeleteTask";

export const useTaskMenuItems = (task: Task) => {
  // Задачу меняет и удаляет любой участник её проекта (контракт API): меню — когда проект открылся
  const { data: project } = useProject(task.projectId);
  const isMember = Boolean(project);
  const { mutateAsync: deleteTask } = useDeleteTask(task.projectId);

  const { showEditTask, showMoveToArchive, showDeleteItem } = useGlobalModals();

  const menuItems: MenuItem[] = [
    {
      label: TEXTS.tasks.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: async () =>
        await showEditTask({
          taskId: task.id,
          title: task.name,
          description: task.description,
        }),
      isVisible: isMember,
    },
    {
      label: TEXTS.tasks.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",

      onClick: async () => {
        const data = { id: task.id, title: task.name };
        const result = await showMoveToArchive({ type: "task", ...data });

        //TODO: implement move to archive logic
        if (result) toast.warning(`Task id: ${task.id} moved to archive`);
      },
      isVisible: isMember,
    },
    {
      label: TEXTS.tasks.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        if (!project) return;
        const data = { id: task.id, title: task.name };
        const result = await showDeleteItem({ type: "task", ...data }); //return taskId

        if (result) await deleteTask(result);
      },
      isVisible: isMember,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
