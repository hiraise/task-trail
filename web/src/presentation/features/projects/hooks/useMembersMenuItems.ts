import type { ProjectMember } from "@/domain/models/ProjectMember";
import { getUserDisplayName } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { projectsTexts } from "@/shared/locales/projects";
import { TEXTS } from "@/shared/locales/texts";
import { canChangeRoles, canRemoveMember } from "@/shared/utils/userRole";

import { useChangeMemberRole } from "./useChangeMemberRole";
import { useProject } from "./useProject";
import { useRemoveMember } from "./useRemoveMember";

/**
 * Действия с участником по роли текущего пользователя: роли меняет владелец, исключает владелец
 * (любого, кроме себя) или администратор (только участников). Себя в меню нет — из проекта
 * выходят через меню проекта.
 */
export const useMembersMenuItems = (member: ProjectMember, projectId: ProjectId) => {
  const { data: project } = useProject(projectId);
  const { data: currentUser } = useGetCurrentUser();
  const { mutate: changeRole } = useChangeMemberRole();
  const { mutate: removeMember } = useRemoveMember();
  const { showDeleteItem } = useGlobalModals();

  if (!project || !currentUser || member.id === currentUser.id) return { menuItems: [] };

  const memberId = member.id;
  const items: MenuItem[] = [
    {
      label: TEXTS.projects.makeAdmin,
      icon: ICONS.profile,
      color: "var(--icon-tertiary)",
      onClick: () => changeRole({ projectId, memberId, role: "admin" }),
      isVisible: canChangeRoles(project.role) && member.role === "member",
    },
    {
      label: projectsTexts.removeAdmin,
      icon: ICONS.profile,
      color: "var(--icon-tertiary)",
      onClick: () => changeRole({ projectId, memberId, role: "member" }),
      isVisible: canChangeRoles(project.role) && member.role === "admin",
    },
    {
      label: TEXTS.projects.kick,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        const title = getUserDisplayName(member);
        const confirmed = await showDeleteItem({ type: "member", id: memberId, title });

        if (confirmed) removeMember({ projectId, memberId });
      },
      isVisible: canRemoveMember(project.role, member.role),
    },
  ];

  return { menuItems: items.filter((item) => item.isVisible) };
};
