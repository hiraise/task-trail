import { useState } from "react";

import type { LabelId } from "@/domain/types";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks";
import type { SelectLabelsProps } from "@/presentation/shared/hooks/useGlobalModals";
import { tasksTexts } from "@/shared/locales/tasks";

import { LabelOptions } from "../../components";

import styles from "./SelectLabelsModal.module.css";

/** The task labels: a multiple choice, so the "Apply" button on every width; returns the chosen IDs. */
export function SelectLabelsModal(props: BaseModalProps<LabelId[]>) {
  const modalProps = useGlobalModalProps<SelectLabelsProps>();

  if (!modalProps) return null;

  return <SelectLabels {...props} {...modalProps} />;
}

function SelectLabels({ projectId, labelIds, onClose, ...rest }: BaseModalProps<LabelId[]> & SelectLabelsProps) {
  const [selected, setSelected] = useState(labelIds);

  return (
    <BaseModal {...rest} onClose={() => onClose()} fullScreen title={tasksTexts.labels}>
      <div className={styles.content}>
        <LabelOptions projectId={projectId} selectedIds={selected} onChange={setSelected} />
        <DialogButtons onClose={() => onClose()} onApply={() => onClose(selected)} />
      </div>
    </BaseModal>
  );
}
