import { useMemo } from "react";
import { useParams } from "next/navigation";

import { PERMISSIONS } from "@/domain/project/project.entity";
import { hasPermission } from "@/shared/utils/permissions";
import { useGetById, useKickMember } from "./useProject";
import { MenuItem } from "@/presentation/widgets/common/DropdownMenu";
import { ICONS } from "@/infrastructure/config/icons";

export const useMemberMenuItems = (userId: number) => {
  const params = useParams();
  const projectId = Number(params.id);
  const { data: project } = useGetById(projectId);

  const { mutateAsync: kick } = useKickMember(projectId);

  const permissions = useMemo(() => project?.permissions || [], [project]);

  const menuItems: MenuItem[] = [
    {
      label: "Назначить администратором",
      icon: ICONS.profile,
      color: "var(--icon-tertiary)",
      //TODO: implement make user admin logic
      onClick: () => console.log("Make admin clicked"),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_EDIT),
    },
    {
      label: "Удалить участника",
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => await kick(userId),
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_INVITE_USERS),
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
