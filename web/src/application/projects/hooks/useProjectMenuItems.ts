import { useRouter } from "next/navigation";

import { ROUTES } from "@/infrastructure/config/routes";
import { useProjects } from "./useProjects";
import { PermissionType, PERMISSIONS } from "@/domain/project/project.entity";
import { hasPermission } from "@/shared/utils/permissions";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { useMemo } from "react";

export interface MenuItem {
  label: string;
  onClick: () => void;
  permission?: PermissionType;
}

export const useProjectMenuItems = (projectId: number) => {
  const { deleteProjectById } = useProjects();
  const project = useAppSelector((state) => state.project.project);
  const permissions = useMemo(() => project?.permissions || [], [project]);
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      label: "Редактировать проект",
      onClick: () => router.push(ROUTES.editProject(String(projectId))),
      permission: PERMISSIONS.PROJECT_EDIT,
    },
    {
      label: "Покинуть проект",
      onClick: () => console.log("Leave project"),
    },
    {
      label: "Удалить проект",
      onClick: async () => {
        await deleteProjectById(projectId);
      },
      permission: PERMISSIONS.PROJECT_DELETE,
    },
    {
      label: "Переместить в архив",
      onClick: () => console.log("Archive project"),
      permission: PERMISSIONS.PROJECT_ARCHIVE,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.permission ? hasPermission(permissions, item.permission) : true
  );

  return { menuItems: visibleMenuItems };
};
