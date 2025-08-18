"use state";

import { useState } from "react";
import clsx from "clsx";

import styles from "./MembersList.module.css";

import { MembersData } from "../../projects/MembersList/MembersList.mock";
import { Input } from "@/presentation/ui/Input/Input.styled";
import { projectsTexts } from "@/shared/locales/projects";
import { UserItem } from "../../projects/MembersList/UserItem";
import { useModalProps } from "@/application/tasks/hooks/useModalProps";

interface MembersListProps {
  members: MembersData[];
  onSelect: (user: MembersData) => void;
}

export function MembersList({ members, onSelect }: MembersListProps) {
  const [query, setQuery] = useState("");
  const { userId } = useModalProps<{ userId?: number }>() || {};

  const filteredMembers = members.filter(
    (user) =>
      (user.username && user.username.toLowerCase().includes(query.toLowerCase())) ||
      user.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <Input
        id="query"
        type="text"
        placeholder={projectsTexts.inviteMembersPlaceHolder}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.membersList}>
        {filteredMembers.map((user) => (
          <div
            key={user.id}
            className={clsx(styles.userItem, user.id === userId && styles.selected)}
            onClick={() => onSelect(user)}
            role="button"
          >
            <UserItem username={user.username} email={user.email} />
          </div>
        ))}
      </div>
    </div>
  );
}
