import { useMemo } from "react";

import { PERMISSIONS } from "@/domain/project/project.entity";
import { hasPermission } from "@/shared/utils/permissions";
import { useGetById } from "../../projects/hooks/useProject";
import { TEXTS } from "@/shared/locales/texts";
import { ICONS } from "@/infrastructure/config/icons";
import { MenuItem } from "@/presentation/widgets/common/DropdownMenu";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { Task } from "@/domain/task/task.entity";

export const useTaskMenuItems = (task: Task) => {
  const { data: project } = useGetById(task.projectId);

  const { showEditTask, showMoveToArchive, showDeleteTask } = useGlobalModals();

  const permissions = useMemo(() => project?.permissions || [], [project]);

  const menuItems: MenuItem[] = [
    {
      label: TEXTS.tasks.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: async () => await showEditTask(task),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_UPDATE_TASK),
    },
    {
      label: TEXTS.tasks.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: async () => await showMoveToArchive(task),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_UPDATE_TASK),
    },
    {
      label: TEXTS.tasks.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => await showDeleteTask(task),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_DELETE_TASK),
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
