"use state";

import { useState } from "react";

import styles from "./MembersListDesktop.module.css";

import { Input } from "@/presentation/ui/Input/Input.styled";
import { UserItem } from "../../projects/MembersList/UserItem";
import { MembersData } from "@/domain/user/user.entity";
import { TEXTS } from "@/shared/locales/texts";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface MembersListProps {
  selectedUserId?: number;
  members: MembersData[];
  onSelect: (user: MembersData) => void;
}

export function MembersListDesktop(props: MembersListProps) {
  const { selectedUserId: userId, members, onSelect } = props;
  const [query, setQuery] = useState("");

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
        placeholder={TEXTS.useQueryPlaceholder}
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
