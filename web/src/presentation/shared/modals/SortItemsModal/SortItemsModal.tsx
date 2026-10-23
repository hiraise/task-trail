import { TEXTS } from "@/shared/locales/texts";
import type { SortOptionValue } from "@/shared/utils/sortItems";

import { SubmitButton } from "../../components";
import { useGlobalModalProps } from "../../hooks/useGlobalModalProps";
import type { SortOptionsProps } from "../../hooks/useGlobalModals";
import { BaseModal, type BaseModalProps } from "../BaseModal";

import { SortItems } from "./SortItems";
import styles from "./SortItemsModal.module.css";

/**
 * Sorting of a list: opens with the current option; picking an option applies it and closes the modal
 * (Figma comment 1636:45413), "Cancel" closes it without a change.
 */
export function SortItemsModal(props: BaseModalProps<SortOptionValue>) {
  const { current = "updatedAt" } = useGlobalModalProps<SortOptionsProps>() ?? {};

  return (
    <BaseModal {...props} title={TEXTS.sort}>
      <div className={styles.content}>
        <SortItems selected={current} onSelect={(option) => props.onClose(option.value)} />
        <SubmitButton variant="secondary" onClick={() => props.onClose()}>
          {TEXTS.cancel}
        </SubmitButton>
      </div>
    </BaseModal>
  );
}
