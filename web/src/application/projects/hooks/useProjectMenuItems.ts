import { useRouter } from "next/navigation";

import { Permission, useProjectPermissions } from "./useProjectPermissions";
import { ROUTES } from "@/infrastructure/config/routes";

export interface MenuItem {
  label: string;
  onClick: () => void;
  permission: Permission;
}

export const useProjectMenuItems = (projectId: string) => {
  const { hasPermission } = useProjectPermissions();
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      label: "Редактировать проект",
      onClick: () => router.push(ROUTES.editProject(projectId)),
      permission: "admin",
    },
    {
      label: "Покинуть проект",
      onClick: () => console.log("Leave project"),
      permission: "member",
    },
    {
      label: "Удалить проект",
      onClick: () => console.log("Delete project"),
      permission: "owner",
    },
    {
      label: "Переместить в архив",
      onClick: () => console.log("Archive project"),
      permission: "owner",
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    hasPermission(item.permission)
  );

  return { menuItems: visibleMenuItems };
};
