import { useMemo } from "react";

import { PERMISSIONS } from "@/domain/project/project.entity";
import { hasPermission } from "@/shared/utils/permissions";
import { useAddMember, useDeleteProject, useGetById, useLeaveProject } from "./useProject";
import { MenuItem } from "@/presentation/widgets/common/DropdownMenu";
import { ICONS } from "@/infrastructure/config/icons";
import { TEXTS } from "@/shared/locales/texts";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

export const useProjectMenuItems = (projectId: number) => {
  const { data: project } = useGetById(projectId);
  const { mutateAsync: leave } = useLeaveProject();
  const { mutateAsync: deleteById } = useDeleteProject();
  const { mutateAsync: addMembers } = useAddMember();
  const { showEditProject, showMoveToArchive, showDeleteItem, showLeaveProject, showInviteUser } =
    useGlobalModals();

  const permissions = useMemo(() => project?.permissions || [], [project]);

  const menuItems: MenuItem[] = [
    {
      label: TEXTS.projects.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (!project) return;
        await showEditProject(project);
      },
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_EDIT),
    },
    {
      label: TEXTS.projects.inviteMember,
      icon: ICONS.addUser,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const emails = await showInviteUser();
        if (!emails || emails.length === 0) return;
        await addMembers(emails);
      },
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_INVITE_USERS),
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
        if (result) console.log(`Project id: ${result} moved to archive`);
      },
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_ARCHIVE),
    },
    {
      label: TEXTS.projects.leave,
      icon: ICONS.leave,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (!project) return;
        const result = await showLeaveProject({ id: project.id, title: project.name });
        if (result) await leave(result);
      },
      isVisible: !hasPermission(permissions, PERMISSIONS.PROJECT_OWNER),
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
      isVisible: hasPermission(permissions, PERMISSIONS.PROJECT_DELETE),
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
