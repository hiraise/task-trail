import { useMemo } from "react";
import { toast } from "sonner";

import { MemberPermissions } from "@/shared/utils/permissions";
import { useGetById, useKickMember } from "./useProject";
import { TEXTS } from "@/shared/locales/texts";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { ICONS } from "@/infrastructure/config/icons";
import { MenuItem } from "@/presentation/widgets/common/DropdownMenu";

export const useMembersMenuItems = (
  memberId: number,
  memberDisplayName: string,
  currentUserId: number,
  projectId: number
) => {
  //TODO: implement getUserById for member displayname
  const { data: project } = useGetById(projectId);
  const { mutateAsync: kick } = useKickMember(projectId);

  const { showDeleteItem } = useGlobalModals();

  const memberPermissions = useMemo(
    () => new MemberPermissions(project?.permissions || []),
    [project?.permissions]
  );

  const permissions = useMemo(
    () => memberPermissions.canManageMember(memberId, currentUserId),
    [memberPermissions, memberId, currentUserId]
  );

  const menuItems: MenuItem[] = [];

  if (permissions.canChangeRole) {
    menuItems.push({
      label: TEXTS.projects.makeAdmin,
      icon: ICONS.profile,
      color: "var(--icon-tertiary)",
      onClick: () => toast.info("Make admin user"),
      isVisible: true,
    });
  }

  if (permissions.canKick) {
    menuItems.push({
      label: TEXTS.projects.kick,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      isVisible: true,
      onClick: async () => {
        const data = { id: memberId, title: memberDisplayName };
        const result = await showDeleteItem({ type: "member", ...data });
        if (result) await kick(memberId);
      },
    });
  }

  return { menuItems };
};
