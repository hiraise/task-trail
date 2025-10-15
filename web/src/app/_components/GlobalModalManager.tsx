"use client";

import { MODAL_TYPE, useGlobalModalContext } from "./GlobalModalContext";
import * as m from "@/presentation/widgets/modals/";

const MODAL_COMPONENTS = {
  [MODAL_TYPE.CREATE_TASK]: m.CreateTaskModal,
  [MODAL_TYPE.SORT_ITEMS]: m.SortItemsModal,
  [MODAL_TYPE.CHANGE_STATUS]: m.ChangeTaskStatusModal,
  [MODAL_TYPE.SELECT_ASSIGNEE]: m.SelectAssigneeModal,
  [MODAL_TYPE.SELECT_PROJECT]: m.SelectProjectModal,
  [MODAL_TYPE.CREATE_PROJECT]: m.CreateProjectModal,
  [MODAL_TYPE.INVITE_USER]: m.InviteUserModal,
  [MODAL_TYPE.EDIT_TASK]: m.EditTaskModal,
  [MODAL_TYPE.MOVE_TO_ARCHIVE]: m.MoveToArchiveModal,
  [MODAL_TYPE.DELETE]: m.DeleteItemModal,
  [MODAL_TYPE.EDIT_PROJECT]: m.EditProjectModal,
  [MODAL_TYPE.LEAVE_PROJECT]: m.LeaveProjectModal,
  [MODAL_TYPE.PROJECT_SETTINGS]: m.ProjectSettingsModal,
  [MODAL_TYPE.TASK_SETTINGS]: m.TaskSettingsModal,
  [MODAL_TYPE.CROP_IMAGE]: m.CropImageModal,
  [MODAL_TYPE.MEMBER_ACTIONS]: m.MemberActionsModal,
} as const;

export function GlobalModalManager() {
  const { stack, close, back } = useGlobalModalContext();
  const topModal = stack[stack.length - 1];
  if (!topModal) return null;

  const { type, props } = topModal;
  const ModalComponent = MODAL_COMPONENTS[type];

  return <ModalComponent isOpen onClose={close} onBack={back} {...props} />;
}
