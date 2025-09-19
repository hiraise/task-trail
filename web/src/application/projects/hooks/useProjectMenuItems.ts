import { useRouter } from "next/navigation";

import { useMemo } from "react";

import { ROUTES } from "@/infrastructure/config/routes";
import { PERMISSIONS } from "@/domain/project/project.entity";
import { hasPermission } from "@/shared/utils/permissions";
import { useDeleteProject, useGetById, useLeaveProject } from "./useProject";
import { MenuItem } from "@/presentation/widgets/common/DropdownMenu";

export const useProjectMenuItems = (projectId: number) => {
  const router = useRouter();

  const { data: project } = useGetById(projectId);
  const { mutateAsync: deleteById } = useDeleteProject();
  const { mutateAsync: leave } = useLeaveProject();

  const permissions = useMemo(() => project?.permissions || [], [project]);

  const menuItems: MenuItem[] = [
    {
      label: "Редактировать проект",
      onClick: () => router.push(ROUTES.editProject(projectId)),
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
