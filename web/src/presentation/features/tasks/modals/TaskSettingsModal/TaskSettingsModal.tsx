import { ActionsMenu, BaseModal, type BaseModalProps } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { TaskProps } from "@/presentation/shared/hooks/useGlobalModals";

import { useTaskMenuItems } from "../../hooks";

/** Меню задачи в нижней панели телефона: шире то же меню — «…» у названия задачи. */
export function TaskSettingsModal(props: BaseModalProps<void>) {
  const { task } = useGlobalModalProps<TaskProps>() ?? {};
  const { menuItems } = useTaskMenuItems(task);

  return (
    <BaseModal {...props} title="">
      <ActionsMenu items={menuItems} onClose={() => props.onClose()} />
    </BaseModal>
  );
}
