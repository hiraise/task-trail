"use client";

import { useState } from "react";

import styles from "./SelectAssigneeModal.module.css";

import { MembersData, users } from "../projects/MembersList/MembersList.mock";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./modal.types";
import { UserItem } from "../projects/MembersList/UserItem";
import { projectsTexts } from "@/shared/locales/projects";
import { Input } from "@/presentation/ui/Input/Input.styled";

interface MembersListProps {
  members: MembersData[];
  onSelect: (user: MembersData) => void;
}

function MembersList({ members, onSelect }: MembersListProps) {
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
            className={styles.userItem}
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

export default function SelectAssigneeModal(props: BaseModalProps<MembersData>) {
  const handleOnSelect = (user: MembersData) => {
    props.onClose(user);
    console.log("Assignee selected:", user.username);
  };

  return (
    <BaseModal {...props} fullScreen={true} title="Ответственный">
      <MembersList members={users} onSelect={handleOnSelect} />
    </BaseModal>
  );
}
