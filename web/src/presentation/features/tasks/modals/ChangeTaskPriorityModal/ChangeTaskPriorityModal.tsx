import { useState } from "react";

import type { TaskPriorityId } from "@/domain/types";
import { DialogButtons } from "@/presentation/shared";
import { useDevice } from "@/presentation/shared/hooks";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { ChangePriorityProps } from "@/presentation/shared/hooks/useGlobalModals";
import type { BaseModalProps } from "@/presentation/shared/modals";
import { BaseModal } from "@/presentation/shared/modals";
import { tasksTexts } from "@/shared/locales/tasks";

import { TaskPriorityList } from "../../components";

/** Priority picker: on a phone the modal closes on selection, wider — via the "Apply" button. */
export function ChangeTaskPriorityModal(props: BaseModalProps<TaskPriorityId>) {
  const { onClose, ...rest } = props;
  const { priority } = useGlobalModalProps<ChangePriorityProps>() ?? {};
  const [selected, setSelected] = useState(priority);
  const isPhone = useDevice() === "mobile";

  const handleSelect = (value: TaskPriorityId) => {
    setSelected(value);
    if (isPhone) onClose(value);
  };

  return (
    <BaseModal title={tasksTexts.priority} onClose={() => onClose()} {...rest}>
      <TaskPriorityList selectedId={selected} onSelect={handleSelect} />
      {!isPhone && <DialogButtons onClose={() => onClose()} onApply={() => onClose(selected)} />}
    </BaseModal>
  );
}
