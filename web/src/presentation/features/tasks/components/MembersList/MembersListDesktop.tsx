"use state";

import { useState } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { UserId } from "@/domain/types";
import { Icon } from "@/presentation/shared";
import { UserItem } from "@/presentation/shared/components/UserItem/UserItem";
import { Input } from "@/presentation/shared/ui/Input";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./MembersListDesktop.module.css";

interface MembersListProps {
  selectedUserId?: UserId;
  members: ProjectMember[];
  onSelect: (user: ProjectMember) => void;
}

export function MembersListDesktop(props: MembersListProps) {
  const { selectedUserId: userId, members, onSelect } = props;
  const [query, setQuery] = useState("");

  const filteredMembers = members.filter(
    (user) =>
      (user.username && user.username.toLowerCase().includes(query.toLowerCase())) ||
      user.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      <Input
        id="query"
        type="text"
        placeholder={TEXTS.userQueryPlaceholder}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.membersList}>
        {filteredMembers.map((user) => (
          <div
            key={user.id}
            className={styles.userItem}
            onClick={() => onSelect(user)}
            role="button"
          >
            <UserItem username={user.username} email={user.email} />
            {user.id === userId && (
              <div className={styles.icon}>
                <Icon as={ICONS.checkMark} size="16px" inheritColor />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
