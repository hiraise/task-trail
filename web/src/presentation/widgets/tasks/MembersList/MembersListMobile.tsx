"use state";

import { useState } from "react";
import clsx from "clsx";

import styles from "./MembersListMobile.module.css";

import { Input } from "@/presentation/ui/Input/Input.styled";
import { projectsTexts } from "@/shared/locales/projects";
import { UserItem } from "../../projects/MembersList/UserItem";
import { MembersData } from "@/domain/user/user.entity";

interface MembersListProps {
  selectedUserId?: number;
  members: MembersData[];
  onSelect: (user: MembersData) => void;
}

export function MembersListMobile(props: MembersListProps) {
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
