import styles from "./SelectedUsers.module.css";
import { UserData } from "../AddParticipantForm/AddParticipantForm";
import { SelectedUserEmail } from "../SelectedUserEmail";

interface SelectedUsersProps {
  emails: string[];
  onDeleteUser: (user: UserData) => void;
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
