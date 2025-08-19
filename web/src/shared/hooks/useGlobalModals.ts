import { useCallback } from "react";

import { MODAL_TYPE, ModalType, useGlobalModalContext } from "@/app/_components/GlobalModalContext";
import { TaskStatus } from "@/domain/task/task.entity";
import { MembersData } from "@/presentation/widgets/projects/MembersList/MembersList.mock";
import { Project } from "@/domain/project/project.entity";

export const useGlobalModals = () => {
  const { open } = useGlobalModalContext();

  const safeOpen = useCallback(
    async <T>(type: ModalType, props?: Record<string, unknown>): Promise<T | undefined> => {
      try {
        return await open<T>(type, props);
      } catch {
        return undefined;
      }
    },
    [open]
  );

  return {
    showSelectAssignee: (userId?: number) =>
      safeOpen<MembersData>(MODAL_TYPE.SELECT_ASSIGNEE, { userId }),

    showSelectProject: (projectId?: number) =>
      safeOpen<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId }),

    showChangeSatus: () => safeOpen<TaskStatus>(MODAL_TYPE.CHANGE_STATUS),
    showSortOptions: () => safeOpen<void>(MODAL_TYPE.SORT_ITEMS),
    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
    showCreateProject: () => safeOpen<void>(MODAL_TYPE.CREATE_PROJECT),
    showInviteUser: () => safeOpen<string[]>(MODAL_TYPE.INVITE_USER),
  };
};
