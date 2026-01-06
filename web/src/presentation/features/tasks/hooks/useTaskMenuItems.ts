import { toast } from "sonner";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { useProject } from "@/presentation/features/projects/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { useDeleteTask } from "./useDeleteTask";

export const useTaskMenuItems = (task: TaskResponseDto) => {
  // const { data: project } = useGetById(task.projectId);
  const { data: project } = useProject(task.projectId);
  const { mutateAsync: deleteTask } = useDeleteTask(task.projectId);

  const { showEditTask, showMoveToArchive, showDeleteItem } = useGlobalModals();

  // const permissions = useMemo(() => project?.permissions || [], [project]);

  const menuItems: MenuItem[] = [
    {
      label: TEXTS.tasks.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: async () =>
        await showEditTask({
          taskId: task.id,
          title: task.title,
          description: task.description,
        }),
      // isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_UPDATE_TASK),
      isVisible: project?.canEdit ?? false,
    },
    {
      label: TEXTS.tasks.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",

      onClick: async () => {
        const data = { id: task.id, title: task.title };
        const result = await showMoveToArchive({ type: "task", ...data });
        //TODO: implement move to archive logic
        if (result) toast.warning(`Task id: ${task.id} moved to archive`);
      },
      // isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_UPDATE_TASK),
      isVisible: project?.canEdit ?? false,
    },
    {
      label: TEXTS.tasks.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        if (!project) return;
        const data = { id: task.id, title: task.title };
        const result = await showDeleteItem({ type: "task", ...data }); //return taskId
        if (result) await deleteTask(result);
      },
      // isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_DELETE_TASK),
      isVisible: project?.canEdit ?? false,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
