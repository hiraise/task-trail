import { useState } from "react";

import { DialogButtons, SubmitButton } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { ChangeDueDateProps } from "@/presentation/shared/hooks/useGlobalModals";
import type { BaseModalProps } from "@/presentation/shared/modals";
import { BaseModal } from "@/presentation/shared/modals";
import { tasksTexts } from "@/shared/locales/tasks";

import styles from "./ChangeDueDateModal.module.css";

/**
 * Due date picker (ADR-0034): the native date field, the remove button and Apply on every width.
 * The result: YYYY-MM-DD, `null` — no due date, `undefined` — closed without a choice.
 */
export function ChangeDueDateModal(props: BaseModalProps<string | null>) {
  const { onClose, ...rest } = props;
  const { dueDate } = useGlobalModalProps<ChangeDueDateProps>() ?? {};
  const [value, setValue] = useState(dueDate ?? "");

  return (
    <BaseModal title={tasksTexts.dueDate} onClose={() => onClose()} {...rest}>
      <div className={styles.body}>
        <input
          type="date"
          className={styles.input}
          aria-label={tasksTexts.dueDate}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        {dueDate && (
          <SubmitButton variant="text" className={styles.remove} onClick={() => onClose(null)}>
            {tasksTexts.removeDueDate}
          </SubmitButton>
        )}
      </div>
      <DialogButtons onClose={() => onClose()} onApply={() => onClose(value || null)} />
    </BaseModal>
  );
}
