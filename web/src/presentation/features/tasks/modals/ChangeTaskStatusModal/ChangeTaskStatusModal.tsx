import { useState } from "react";

import type { TaskStatusId } from "@/domain/types";
import { DialogButtons } from "@/presentation/shared";
import { useDevice } from "@/presentation/shared/hooks";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { ChangeStatusProps } from "@/presentation/shared/hooks/useGlobalModals";
import type { BaseModalProps } from "@/presentation/shared/modals";
import { BaseModal } from "@/presentation/shared/modals";
import { TEXTS } from "@/shared/locales/texts";

import { TaskStatusList } from "../../components";

/** Выбор статуса: на телефоне окно закрывается выбором, шире — кнопкой «Применить» (макет). */
export function ChangeTaskStatusModal(props: BaseModalProps<TaskStatusId>) {
  const { onClose, ...rest } = props;
  const { statusId } = useGlobalModalProps<ChangeStatusProps>() ?? {};
  const [selected, setSelected] = useState(statusId);
  const isPhone = useDevice() === "mobile";

  const handleSelect = (value: TaskStatusId) => {
    setSelected(value);
    if (isPhone) onClose(value);
  };

  return (
    <BaseModal title={TEXTS.tasks.status} onClose={() => onClose()} {...rest}>
      <TaskStatusList selectedId={selected} onSelect={handleSelect} />
      {!isPhone && <DialogButtons onClose={() => onClose()} onApply={() => onClose(selected)} />}
    </BaseModal>
  );
}
