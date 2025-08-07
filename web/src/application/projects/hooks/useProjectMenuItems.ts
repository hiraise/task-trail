import { useRouter } from "next/navigation";

import { Permission, useProjectPermissions } from "./useProjectPermissions";
import { ROUTES } from "@/infrastructure/config/routes";
import { useProjects } from "./useProjects";

export interface MenuItem {
  label: string;
  onClick: () => void;
  permission: Permission;
}

export const useProjectMenuItems = (projectId: number) => {
  const { hasPermission } = useProjectPermissions();
  const { deleteProjectById } = useProjects();
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      label: "Редактировать проект",
      onClick: () => router.push(ROUTES.editProject(String(projectId))),
      permission: "admin",
    },
    {
      label: "Покинуть проект",
      onClick: () => console.log("Leave project"),
      permission: "member",
    },
    {
      label: "Удалить проект",
      onClick: async () => {
        await deleteProjectById(projectId);
      },
      permission: "owner",
    },
    {
      label: "Переместить в архив",
      onClick: () => console.log("Archive project"),
      permission: "owner",
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => hasPermission(item.permission));

  return { menuItems: visibleMenuItems };
};
