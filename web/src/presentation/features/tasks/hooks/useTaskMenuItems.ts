import { toast } from "sonner";

import type { Task } from "@/domain/models/Task";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { useDeleteTask } from "./useDeleteTask";

/** Task actions: any member of the task's project can edit and delete it (API contract). */
export const useTaskMenuItems = (task?: Task) => {
  const { mutate: deleteTask } = useDeleteTask();
  const { showEditTask, showMoveToArchive, showDeleteItem } = useGlobalModals();

  if (!task) return { menuItems: [] };

  const menuItems: MenuItem[] = [
    {
      label: TEXTS.tasks.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: () => showEditTask(task),
      isVisible: true,
    },
    {
      label: TEXTS.tasks.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const result = await showMoveToArchive({ type: "task", id: task.id, title: task.name });

        // The server has no archive yet — stage 2 (docs/roadmap.md)
        if (result) toast.warning(`Task id: ${task.id} moved to archive`);
      },
      isVisible: true,
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

  return { menuItems };
};
