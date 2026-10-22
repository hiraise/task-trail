import { toast } from "sonner";

import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";
import {
  canArchiveProject,
  canDeleteProject,
  canEditProject,
  canInviteMembers,
  canLeaveProject,
} from "@/shared/utils/userRole";

import { useAddMembers } from "./useAddMembers";
import { useDeleteProject } from "./useDeleteProject";
import { useLeaveProject } from "./useLeaveProject";
import { useProject } from "./useProject";

/** Действия с проектом по роли текущего пользователя в нём (shared/utils/userRole.ts). */
export const useProjectMenuItems = (projectId: ProjectId) => {
  const { data: project } = useProject(projectId);
  const { mutate: leave } = useLeaveProject();
  const { mutate: deleteById } = useDeleteProject();
  const { mutate: addMembers } = useAddMembers();
  const { showEditProject, showMoveToArchive, showDeleteItem, showLeaveProject, showInviteUser } =
    useGlobalModals();

  if (!project) return { menuItems: [] };

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
        }),
      isVisible: canEditProject(project.role),
    },
    {
      label: TEXTS.projects.inviteMember,
      icon: ICONS.addUser,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const emails = await showInviteUser({ projectId });

        if (emails && emails.length > 0) addMembers({ projectId, emails });
      },
      isVisible: canInviteMembers(project.role),
    },
    {
      label: TEXTS.projects.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const result = await showMoveToArchive({
          type: "project",
          id: project.id,
          title: project.name,
        });

        // Архива на сервере ещё нет — этап 2 (docs/roadmap.md)
        if (result) toast.warning(`Project id: ${result} moved to archive`);
      },
      isVisible: canArchiveProject(project.role),
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
