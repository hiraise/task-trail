import { useState } from "react";

import type { User } from "@/domain/models/User";
import type { UserId } from "@/domain/types";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, SubmitButton } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks";
import type { SelectBoardMembersProps } from "@/presentation/shared/hooks/useGlobalModals";
import { boardsTexts } from "@/shared/locales/boards";

import { useGetProjectCandidates } from "../../projects/hooks";
import { BoardMemberPicker } from "../components/BoardMemberPicker";

import styles from "./BoardModals.module.css";

/** People for a board from GET /v1/projects/candidates; returns the chosen ones. */
export function SelectBoardMembersModal(props: BaseModalProps<User[]>) {
  const modalProps = useGlobalModalProps<SelectBoardMembersProps>();

  if (!modalProps) return null;

  return <SelectMembers {...props} {...modalProps} />;
}

function SelectMembers({
  selectedIds,
  excludeIds = [],
  applyText,
  onClose,
  ...rest
}: BaseModalProps<User[]> & SelectBoardMembersProps) {
  const { data: candidates } = useGetProjectCandidates();
  const [chosenIds, setChosenIds] = useState<UserId[]>(selectedIds);
  const available = candidates?.filter((user) => !excludeIds.includes(user.id));

  const toggle = (user: User) =>
    setChosenIds((prev) =>
      prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id],
    );

  // Only current candidates: someone chosen earlier may have left the shared project since
  const apply = () => onClose((available ?? []).filter((user) => chosenIds.includes(user.id)));

  return (
    <BaseModal {...rest} onClose={() => onClose()} fullScreen title={boardsTexts.addMembers}>
      <div className={styles.picker}>
        <BoardMemberPicker
          candidates={available}
          selectedIds={chosenIds}
          onToggle={toggle}
        />
        <SubmitButton type="button" disabled={!available} onClick={apply}>
          {applyText}
        </SubmitButton>
      </div>
    </BaseModal>
  );
}
