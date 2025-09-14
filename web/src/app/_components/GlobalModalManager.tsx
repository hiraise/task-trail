"use client";

import CreateTaskModal from "@/presentation/widgets/modals/CreateTaskModal";
import { MODAL_TYPE, useGlobalModalContext } from "./GlobalModalContext";
import SelectAssigneeModal from "@/presentation/widgets/modals/SelectAssigneeModal";
import SelectProjectModal from "@/presentation/widgets/modals/SelectProjectModal";
import ChangeTaskStatusModal from "@/presentation/widgets/modals/ChangeTaskStatusModal";
import SortItemsModal from "@/presentation/widgets/modals/SortItemsModal";
import InviteUserModal from "@/presentation/widgets/modals/InviteUserModal";
import CreateProjectModal from "@/presentation/widgets/modals/CreateProjectModal";

const MODAL_COMPONENTS = {
  [MODAL_TYPE.CREATE_TASK]: CreateTaskModal,
  [MODAL_TYPE.SORT_ITEMS]: SortItemsModal,
  [MODAL_TYPE.CHANGE_STATUS]: ChangeTaskStatusModal,
  [MODAL_TYPE.SELECT_ASSIGNEE]: SelectAssigneeModal,
  [MODAL_TYPE.SELECT_PROJECT]: SelectProjectModal,
  [MODAL_TYPE.CREATE_PROJECT]: CreateProjectModal,
  [MODAL_TYPE.INVITE_USER]: InviteUserModal,
} as const;

export function GlobalModalManager() {
  const { stack, close, back } = useGlobalModalContext();
  const topModal = stack[stack.length - 1];
  if (!topModal) return null;

  const { type, props } = topModal;
  const ModalComponent = MODAL_COMPONENTS[type];

  return <ModalComponent isOpen onClose={close} onBack={back} {...props} />;
}
