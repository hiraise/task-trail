import { isProjectArchived } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { projectsTexts } from "@/shared/locales/projects";
import { TEXTS } from "@/shared/locales/texts";
import {
  canArchiveProject,
  canChangeProjectKey,
  canDeleteProject,
  canEditProject,
  canInviteMembers,
  canLeaveProject,
} from "@/shared/utils/userRole";

import { useAddMembers } from "./useAddMembers";
import { useDeleteProject } from "./useDeleteProject";
import { useLeaveProject } from "./useLeaveProject";
import { useProject } from "./useProject";
import { useSetProjectArchived } from "./useSetProjectArchived";

/**
 * Project actions based on the current user's role in it (shared/utils/userRole.ts). An archived
 * project is read-only: the owner restores or deletes it, the others leave it (ADR-0027).
 */
export const useProjectMenuItems = (projectId: ProjectId) => {
  const { data: project } = useProject(projectId);
  const { mutate: leave } = useLeaveProject();
  const { mutate: deleteById } = useDeleteProject();
  const { mutate: addMembers } = useAddMembers();
  const { mutate: setArchived } = useSetProjectArchived();
  const { showEditProject, showMoveToArchive, showDeleteItem, showLeaveProject, showInviteUser } =
    useGlobalModals();

  if (!project) return { menuItems: [] };

  const archived = isProjectArchived(project);

  const menuItems: MenuItem[] = [
    {
      label: TEXTS.projects.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: () =>
        showEditProject({
          projectId: project.id,
          name: project.name,
          description: project.description,
          key: canChangeProjectKey(project.role) ? project.key : undefined,
        }),
      isVisible: !archived && canEditProject(project.role),
    },
    {
      label: TEXTS.projects.inviteMember,
      icon: ICONS.addUser,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const emails = await showInviteUser({ projectId });

        if (emails && emails.length > 0) addMembers({ projectId, emails });
      },
      isVisible: !archived && canInviteMembers(project.role),
    },
    {
      label: TEXTS.projects.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const confirmed = await showMoveToArchive({
          type: "project",
          id: project.id,
          title: project.name,
        });

        if (confirmed) setArchived({ projectId, archived: true });
      },
      isVisible: !archived && canArchiveProject(project.role),
    },
    {
      // Restoring needs no confirmation: it is undone by archiving again
      label: projectsTexts.restore,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: () => setArchived({ projectId, archived: false }),
      isVisible: archived && canArchiveProject(project.role),
    },
    {
      label: TEXTS.projects.leave,
      icon: ICONS.leave,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const result = await showLeaveProject({ id: project.id, title: project.name });

        if (result) leave({ projectId: result });
      },
      isVisible: canLeaveProject(project.role),
    },
    {
      label: TEXTS.projects.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        const result = await showDeleteItem({
          type: "project",
          id: project.id,
          title: project.name,
        });

        if (result) deleteById(projectId);
      },
      isVisible: canDeleteProject(project.role),
    },
  ];

  return { menuItems: menuItems.filter((item) => item.isVisible) };
};
