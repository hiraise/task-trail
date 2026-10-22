import { DialogButtons } from "../../components";
import { useGlobalModalProps } from "../../hooks/useGlobalModalProps";
import type { ConfirmProps } from "../../hooks/useGlobalModals";
import { BaseModal, type BaseModalProps } from "../BaseModal";

import styles from "./ConfirmModal.module.css";

/** Action confirmation: "Cancel" and the action button; consent returns `true`. */
export function ConfirmModal(props: BaseModalProps<boolean>) {
  const { title, description, confirmText } = useGlobalModalProps<ConfirmProps>() ?? {};

  if (!title || !confirmText) return null;

  return (
    <BaseModal {...props} title="">
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className="body-reg">{description}</p>}
        <DialogButtons
          onClose={() => props.onClose()}
          onApply={() => props.onClose(true)}
          applyText={confirmText}
        />
      </div>
    </BaseModal>
  );
}
