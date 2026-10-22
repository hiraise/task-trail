import { Suspense, useState } from "react";

import { MODAL_TYPE, useGlobalModalContext } from "./GlobalModalContext";
import {
  CreateProjectModal,
  CreateTaskModal,
  CropImageModal,
  DeleteItemModal,
  EditProjectModal,
  EditTaskModal,
  InvitationResultsModal,
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
import { ModalAppearContext } from "./modalAppear";

const MODAL_COMPONENTS = {
  [MODAL_TYPE.CREATE_TASK]: CreateTaskModal,
  [MODAL_TYPE.SORT_ITEMS]: SortItemsModal,
  [MODAL_TYPE.CHANGE_STATUS]: ChangeTaskStatusModal,
  [MODAL_TYPE.SELECT_ASSIGNEE]: SelectAssigneeModal,
  [MODAL_TYPE.SELECT_PROJECT]: SelectProjectModal,
  [MODAL_TYPE.CREATE_PROJECT]: CreateProjectModal,
  [MODAL_TYPE.INVITE_USER]: InviteUserModal,
  [MODAL_TYPE.INVITATION_RESULTS]: InvitationResultsModal,
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
  // Видно только верхнее окно. Сменилось окно на окне (выбор из формы, возврат в форму) —
  // новое появляется без анимации: затемнение и панель остаются на месте (ModalAppearContext)
  const [shownModal, setShownModal] = useState(topModal);
  const [appear, setAppear] = useState(true);

  if (topModal !== shownModal) {
    setShownModal(topModal);
    setAppear(!shownModal);
  }

  if (!topModal) return null;

  const { type, props } = topModal;
  const ModalComponent = MODAL_COMPONENTS[type];

  return (
    <ModalAppearContext value={appear}>
      <Suspense>
        <ModalComponent isOpen onClose={close} onBack={back} {...props} />
      </Suspense>
    </ModalAppearContext>
  );
}
