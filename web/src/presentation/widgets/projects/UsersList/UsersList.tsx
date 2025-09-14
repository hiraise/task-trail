import { clsx } from "clsx";

import styles from "./UsersList.module.css";

import { UserItemCheckBox } from "./UserItemCheckbox";
import { VALIDATION_PATTERNS } from "@/shared/utils/validate";
import { UserItem } from "./UserItem";
import { projectsTexts } from "@/shared/locales/projects";
import { Spinner } from "@/presentation/ui/Spinner";
import { useGetCandidates } from "@/application/projects/hooks/useProject";
import { BaseUserData } from "@/domain/user/user.entity";

interface UsersListProps {
  onUserSelect: (data: BaseUserData) => void;
  selectedUsers?: BaseUserData[];
  searchQuery?: string;
}

export function UsersList({ onUserSelect, selectedUsers = [], searchQuery = "" }: UsersListProps) {
  const { data: usersToDisplay, isLoading } = useGetCandidates();

  if (!usersToDisplay || (usersToDisplay.length === 0 && !searchQuery)) {
    return (
      <div className={clsx(styles.container, styles.emptyState)}>
        Уппппссс... Похоже, что у вас нет кандидатов для добавления в проект.
      </div>
    );
  }

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
        const isSelected = selectedUsers.some((selected) => selected.email === user.email);

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
