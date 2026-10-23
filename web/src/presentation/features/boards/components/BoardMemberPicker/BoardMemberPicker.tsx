import clsx from "clsx";
import { useState } from "react";

import type { User } from "@/domain/models/User";
import type { UserId } from "@/domain/types";
import { CheckBox, Spinner, UserItem } from "@/presentation/shared";
import { Input } from "@/presentation/shared/ui/Input";
import { boardsTexts } from "@/shared/locales/boards";

import styles from "./BoardMemberPicker.module.css";

interface BoardMemberPickerProps {
  /** People who share a project with the current user (listProjectCandidates) */
  candidates?: User[];
  selectedIds: UserId[];
  onToggle: (user: User) => void;
}

/**
 * Whom to add to a board: the same list as "Add members" of a project, without email input —
 * boards have no email invitations (ADR-0029).
 */
export function BoardMemberPicker({ candidates, selectedIds, onToggle }: BoardMemberPickerProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const found = candidates?.filter(
    (user) => !needle || user.email.includes(needle) || user.username?.toLowerCase().includes(needle),
  );

  return (
    <div className={styles.container}>
      <Input
        id="boardMemberQuery"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={boardsTexts.searchPeople}
        autoComplete="off"
      />
      <div className={styles.list}>
        {!found && <Spinner size={30} />}
        {found?.length === 0 && (
          <p className={clsx("caption-reg", styles.empty)}>
            {needle ? boardsTexts.candidatesNotFound : boardsTexts.noCandidates}
          </p>
        )}
        {found?.map((user) => (
          <div key={user.id} className={styles.row}>
            <UserItem email={user.email} username={user.username} avatarUrl={user.avatarUrl} />
            <CheckBox checked={selectedIds.includes(user.id)} onChange={() => onToggle(user)} />
          </div>
        ))}
      </div>
      <p className={clsx("caption-reg", styles.note)}>{boardsTexts.membersNote}</p>
    </div>
  );
}
