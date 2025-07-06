import { UserItem } from "./UserItem";
import { users as mockUsers } from "./UsersList.mock";
import styles from "./UsersList.module.css";
import { UserData } from "../AddParticipantForm/AddParticipantForm";

interface UsersListProps {
  onUserSelect?: (user: UserData) => void;
  selectedUsers?: UserData[];
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
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          {searchQuery
            ? "No users found matching your search."
            : "No users available."}
        </div>
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
          <UserItem
            key={user.id || user.email}
            user={user}
            isSelected={isSelected}
            onSelect={onUserSelect}
          />
        );
      })}
    </div>
  );
}
