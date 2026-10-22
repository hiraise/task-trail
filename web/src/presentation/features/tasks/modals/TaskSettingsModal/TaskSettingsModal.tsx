import { ActionsMenu, BaseModal, type BaseModalProps } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { TaskProps } from "@/presentation/shared/hooks/useGlobalModals";

import { useTaskMenuItems } from "../../hooks";

/** Task menu in the phone bottom sheet; wider, the same menu is the "…" next to the task name. */
export function TaskSettingsModal(props: BaseModalProps<void>) {
  const { task } = useGlobalModalProps<TaskProps>() ?? {};
  const { menuItems } = useTaskMenuItems(task);

  return (
    <BaseModal {...props} title="">
      <ActionsMenu items={menuItems} onClose={() => props.onClose()} />
    </BaseModal>
  );
}
