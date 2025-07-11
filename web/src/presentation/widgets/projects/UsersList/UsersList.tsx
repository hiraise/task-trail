import { clsx } from "clsx";

import styles from "./UsersList.module.css";
import { UserItemCheckBox } from "./UserItemCheckbox";
import { users as mockUsers } from "./UsersList.mock";
import {
  BaseUserData,
  UserData,
} from "../AddParticipantForm/AddParticipantForm";
import { VALIDATION_PATTERNS } from "@/shared/utils/validate";
import { UserItem } from "./UserItem";
import { projectsTexts } from "@/shared/locales/projects";

interface UsersListProps {
  onUserSelect: (data: BaseUserData) => void;
  selectedUsers?: BaseUserData[];
  searchQuery?: string;
  availableUsers?: UserData[]; // Optional prop to override mock users
}

export function UsersList({
  onUserSelect,
  selectedUsers = [],
  searchQuery = "",
  availableUsers,
}: UsersListProps) {
  // Use provided users or fall back to mock users
  const usersToDisplay = availableUsers || mockUsers;

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? usersToDisplay.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : usersToDisplay;

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
