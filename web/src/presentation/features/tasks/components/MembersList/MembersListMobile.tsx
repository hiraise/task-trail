"use state";

import clsx from "clsx";
import { useState } from "react";

import type { ProjectMemberResponseDto } from "@/application/dto/ProjectMemberResponseDto";
import { UserItem } from "@/presentation/shared/components/UserItem/UserItem";
import { Input } from "@/presentation/shared/ui/Input";
import { projectsTexts } from "@/shared/locales/projects";

import styles from "./MembersListMobile.module.css";

interface MembersListProps {
  selectedUserId?: number;
  members: ProjectMemberResponseDto[];
  onSelect: (user: ProjectMemberResponseDto) => void;
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
