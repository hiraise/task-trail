import { useRouter } from "next/navigation";

import { ROUTES } from "@/infrastructure/config/routes";
import { useProjects } from "./useProjects";
import { PERMISSIONS } from "@/domain/project/project.entity";
import { hasPermission } from "@/shared/utils/permissions";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { useMemo } from "react";

export interface MenuItem {
  label: string;
  onClick: () => void;
  isVisible: boolean;
}

export const useProjectMenuItems = (projectId: number) => {
  const { deleteById, leave } = useProjects();
  const project = useAppSelector((state) => state.project.project);
  const permissions = useMemo(() => project?.permissions || [], [project]);
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      label: "Редактировать проект",
      onClick: () => router.push(ROUTES.editProject(String(projectId))),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_EDIT),
    },
    {
      label: "Покинуть проект",
      onClick: async () => await leave(projectId),
      isVisible: !hasPermission(permissions, PERMISSIONS.PROJECT_OWNER),
    },
    {
      label: "Удалить проект",
      onClick: async () => await deleteById(projectId),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_DELETE),
    },
    {
      label: "Переместить в архив",
      onClick: () => console.log("Archive project"),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_ARCHIVE),
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
