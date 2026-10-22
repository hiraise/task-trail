import clsx from "clsx";
import { useState } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { UserId } from "@/domain/types";
import { Icon, Spinner, UserItem } from "@/presentation/shared";
import { Input } from "@/presentation/shared/ui/Input";
import { ICONS } from "@/shared/config/icons";
import { projectsTexts } from "@/shared/locales/projects";
import { tasksTexts } from "@/shared/locales/tasks";

import styles from "./AssigneeList.module.css";

interface AssigneeListProps {
  /** Участники проекта задачи; undefined — проект не выбран */
  members?: ProjectMember[];
  isLoading?: boolean;
  selectedId?: UserId;
  onSelect: (member: ProjectMember) => void;
}

/** Выбор ответственного из участников проекта: поиск по имени и почте, выбранный — с галочкой. */
export function AssigneeList({ members, isLoading, selectedId, onSelect }: AssigneeListProps) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();

  const found = (members ?? []).filter(
    (member) =>
      member.email.includes(search) || member.username?.toLowerCase().includes(search),
  );

  const renderList = () => {
    if (isLoading) return <Spinner size={30} />;
    if (!members) return <p className={styles.empty}>{tasksTexts.chooseProjectFirst}</p>;
    if (found.length === 0) return <p className={styles.empty}>{tasksTexts.nobodyFound}</p>;

    return found.map((member) => {
      const isSelected = member.id === selectedId;

      return (
        <button
          key={member.id}
          type="button"
          className={clsx(styles.member, isSelected && styles.selected)}
          onClick={() => onSelect(member)}
          aria-pressed={isSelected}
        >
          <UserItem email={member.email} username={member.username} avatarUrl={member.avatarUrl} />
          {isSelected && (
            <span className={styles.check}>
              <Icon as={ICONS.checkMark} size="16px" inheritColor />
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <div className={styles.container}>
      {members && (
        <Input
          id="assigneeQuery"
          type="text"
          placeholder={projectsTexts.inviteMembersPlaceHolder}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      <div className={styles.list}>{renderList()}</div>
    </div>
  );
}
