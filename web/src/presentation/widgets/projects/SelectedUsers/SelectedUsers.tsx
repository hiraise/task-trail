import styles from "./SelectedUsers.module.css";
import { UserData } from "../AddParticipantForm/AddParticipantForm";
import { SelectedUserEmail } from "../SelectedUserEmail";

interface SelectedUsersProps {
  users: UserData[];
  onDeleteUser: (user: UserData) => void;
  isExpanded?: boolean;
}

export function SelectedUsers({
  users,
  onDeleteUser,
  isExpanded = false,
}: SelectedUsersProps) {
  return (
    <div className={isExpanded ? styles.expanded : styles.container}>
      {users.map((user) => (
        <SelectedUserEmail
          key={user.email} // Use email as unique key
          email={user.email}
          onClick={onDeleteUser}
        />
      ))}
    </div>
  );
}
