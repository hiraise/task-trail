import { toast } from "sonner";

import { canUserManageMembers } from "@/domain/models/Project";
import type { ProjectId, UserId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { useProject } from "./useProject";
import { useRemoveMember } from "./useRemoveMember";

export const useMembersMenuItems = (
  memberId: UserId,
  memberDisplayName: string,
  currentUserId: UserId,
  projectId: ProjectId,
) => {
  const { data: project } = useProject(projectId);
  const { mutateAsync: removeMember } = useRemoveMember();

  const { showDeleteItem } = useGlobalModals();

  const menuItems: MenuItem[] = [];

  if (project && canUserManageMembers(project)) {
    menuItems.push({
      label: TEXTS.projects.makeAdmin,
      icon: ICONS.profile,
      color: "var(--icon-tertiary)",
      onClick: () => toast.info("Make admin user"),
      isVisible: true,
    });
  }

  if (project && canUserManageMembers(project)) {
    menuItems.push({
      label: TEXTS.projects.kick,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      isVisible: true,
      onClick: async () => {
        const data = { id: memberId, title: memberDisplayName };
        const result = await showDeleteItem({ type: "member", ...data });

        if (result) await removeMember({ projectId, memberId });
      },
    });
  }

  return { menuItems };
};
