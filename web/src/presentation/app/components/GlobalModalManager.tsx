import { Suspense } from "react";

import { MODAL_TYPE, useGlobalModalContext } from "./GlobalModalContext";
import {
  CreateProjectModal,
  CreateTaskModal,
  CropImageModal,
  DeleteItemModal,
  EditProjectModal,
  EditTaskModal,
  InviteUserModal,
  LeaveProjectModal,
  MemberActionsModal,
  MoveToArchiveModal,
  ProjectSettingsModal,
  SelectAssigneeModal,
  SelectProjectModal,
  SortItemsModal,
  TaskSettingsModal,
  ChangeTaskStatusModal,
} from "./lazyModalComponents";

const MODAL_COMPONENTS = {
  [MODAL_TYPE.CREATE_TASK]: CreateTaskModal,
  [MODAL_TYPE.SORT_ITEMS]: SortItemsModal,
  [MODAL_TYPE.CHANGE_STATUS]: ChangeTaskStatusModal,
  [MODAL_TYPE.SELECT_ASSIGNEE]: SelectAssigneeModal,
  [MODAL_TYPE.SELECT_PROJECT]: SelectProjectModal,
  [MODAL_TYPE.CREATE_PROJECT]: CreateProjectModal,
  [MODAL_TYPE.INVITE_USER]: InviteUserModal,
  [MODAL_TYPE.EDIT_TASK]: EditTaskModal,
  [MODAL_TYPE.MOVE_TO_ARCHIVE]: MoveToArchiveModal,
  [MODAL_TYPE.DELETE]: DeleteItemModal,
  [MODAL_TYPE.EDIT_PROJECT]: EditProjectModal,
  [MODAL_TYPE.LEAVE_PROJECT]: LeaveProjectModal,
  [MODAL_TYPE.PROJECT_SETTINGS]: ProjectSettingsModal,
  [MODAL_TYPE.TASK_SETTINGS]: TaskSettingsModal,
  [MODAL_TYPE.CROP_IMAGE]: CropImageModal,
  [MODAL_TYPE.MEMBER_ACTIONS]: MemberActionsModal,
} as const;

export function GlobalModalManager() {
  const { stack, close, back } = useGlobalModalContext();
  const topModal = stack[stack.length - 1];

  if (!topModal) return null;

  const { type, props } = topModal;
  const ModalComponent = MODAL_COMPONENTS[type];

  return (
    <Suspense>
      <ModalComponent isOpen onClose={close} onBack={back} {...props} />
    </Suspense>
  );
}
