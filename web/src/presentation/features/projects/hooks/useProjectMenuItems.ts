import { toast } from "sonner";

import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { useAddMember, useLeaveProject } from "../../projects/hooks";

import { useDeleteProject } from "./useDeleteProject";
import { useProject } from "./useProject";

export const useProjectMenuItems = (projectId: string | number) => {
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
      // isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_EDIT),
      isVisible: project?.canEdit ?? false,
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
      // isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_INVITE_USERS),
      isVisible: project?.canManageMembers ?? false,
    },
    {
      label: TEXTS.projects.moveToArchive,
      icon: ICONS.archive,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (!project) return;
        const data = { id: Number(project.id), title: project.name };
        const result = await showMoveToArchive({ type: "project", ...data });
        //TODO: implement move to archive logic
        if (result) toast.warning(`Project id: ${result} moved to archive`);
      },
      // isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_ARCHIVE),
      isVisible: project?.canArchiveProject ?? false,
    },
    {
      label: TEXTS.projects.leave,
      icon: ICONS.leave,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (!project) return;
        const result = await showLeaveProject({ id: Number(project.id), title: project.name });
        if (result) await leave({ projectId: result });
      },
      // isVisible: !hasPermission(permissions, PERMISSIONS.PROJECT_OWNER),
      isVisible: !project?.isOwner,
    },
    {
      label: TEXTS.projects.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        if (!project) return;
        const data = { id: Number(project.id), title: project.name };
        const result = await showDeleteItem({ type: "project", ...data });
        if (result) await deleteById(projectId);
      },
      // isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_DELETE),
      isVisible: project?.canDelete ?? false,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
