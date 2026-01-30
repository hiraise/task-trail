import { toast } from "sonner";

import {
  canUserArchiveProject,
  canUserDeleteProject,
  canUserEditProject,
  canUserManageMembers,
  isProjectOwner,
} from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { useAddMember, useLeaveProject } from "../../projects/hooks";

import { useDeleteProject } from "./useDeleteProject";
import { useProject } from "./useProject";

export const useProjectMenuItems = (projectId: ProjectId) => {
  const { data: project } = useProject(projectId);
  const { mutateAsync: leave } = useLeaveProject();
  const { mutateAsync: deleteById } = useDeleteProject();
  const { mutateAsync: addMembers } = useAddMember();
  const { showEditProject, showMoveToArchive, showDeleteItem, showLeaveProject, showInviteUser } =
    useGlobalModals();

  const menuItems: MenuItem[] = [
    {
      label: TEXTS.projects.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (!project) return;
        await showEditProject({
          projectId: project.id,
          name: project.name,
          description: project.description,
        });
      },
      isVisible: project ? canUserEditProject(project) : false,
    },
    {
      label: TEXTS.projects.inviteMember,
      icon: ICONS.addUser,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const emails = await showInviteUser();
        if (!emails || emails.length === 0) return;
        await addMembers({ projectId, emails });
      },
      isVisible: project ? canUserManageMembers(project) : false,
    },
    {
      label: TEXTS.projects.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (!project) return;
        const data = { id: project.id, title: project.name };
        const result = await showMoveToArchive({ type: "project", ...data });
        //TODO: implement move to archive logic
        if (result) toast.warning(`Project id: ${result} moved to archive`);
      },
      isVisible: project ? canUserArchiveProject(project) : false,
    },
    {
      label: TEXTS.projects.leave,
      icon: ICONS.leave,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (!project) return;
        const result = await showLeaveProject({ id: project.id, title: project.name });
        if (result) await leave({ projectId: result });
      },
      isVisible: project ? !isProjectOwner(project) : false,
    },
    {
      label: TEXTS.projects.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        if (!project) return;
        const data = { id: project.id, title: project.name };
        const result = await showDeleteItem({ type: "project", ...data });
        if (result) await deleteById(projectId);
      },
      isVisible: project ? canUserDeleteProject(project) : false,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
