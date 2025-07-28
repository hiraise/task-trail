import { clsx } from "clsx";

import styles from "./UsersList.module.css";
import { UserItemCheckBox } from "./UserItemCheckbox";
import { BaseUserData } from "../AddParticipantForm/AddParticipantForm";
import { VALIDATION_PATTERNS } from "@/shared/utils/validate";
import { UserItem } from "./UserItem";
import { projectsTexts } from "@/shared/locales/projects";
import { useEffect, useState } from "react";
import { useProjects } from "@/application/projects/hooks/useProjects";
import { User } from "@/domain/user/user.entity";
import { Spinner } from "@/presentation/ui/Spinner";

interface UsersListProps {
  onUserSelect: (data: BaseUserData) => void;
  selectedUsers?: BaseUserData[];
  searchQuery?: string;
}

export function UsersList({
  onUserSelect,
  selectedUsers = [],
  searchQuery = "",
}: UsersListProps) {
  const { isLoading, getCandidates } = useProjects();
  const [usersToDisplay, setUsersToDisplay] = useState<User[]>([]);

  // Fetch candidates when component mounts or when getCandidates changes
  useEffect(() => {
    const fetch = async () => {
      const candidates = await getCandidates();
      setUsersToDisplay(candidates ?? []);
    };
    fetch();
  }, [getCandidates]);

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? usersToDisplay.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : usersToDisplay;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Spinner size={30} />
      </div>
    );
  }

  if (filteredUsers.length === 0 && !searchQuery) {
    return (
      <div className={clsx(styles.container, styles.emptyState)}>
        Уппппссс... Похоже, что у вас нет кандидатов для добавления в проект.
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return VALIDATION_PATTERNS.email.test(searchQuery) ? (
      <div
        className={clsx(styles.container, styles.selectUser)}
        onClick={() => onUserSelect({ email: searchQuery })}
      >
        <UserItem email={searchQuery} />
      </div>
    ) : (
      <div className={clsx(styles.container, styles.emptyState)}>
        {searchQuery && projectsTexts.userNotFound}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {filteredUsers.map((user) => {
        const isSelected = selectedUsers.some(
          (selected) => selected.email === user.email
        );

        return (
          <UserItemCheckBox
            key={user.email}
            user={user}
            isSelected={isSelected}
            onSelect={onUserSelect}
          />
        );
      })}
    </div>
  );
}
