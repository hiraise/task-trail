import { SelectedUserEmail } from "./SelectedUserEmail";
import styles from "./SelectedUsers.module.css";

interface SelectedUsersProps {
  emails: string[];
  onDeleteUser: (email: string) => void;
  isExpanded?: boolean;
}

export function SelectedUsers({ emails, onDeleteUser, isExpanded = false }: SelectedUsersProps) {
  return (
    <div className={isExpanded ? styles.expanded : styles.container}>
      {emails.toReversed().map((email) => (
        <SelectedUserEmail key={email} email={email} onClick={onDeleteUser} />
      ))}
    </div>
  );
}
