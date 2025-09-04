import styles from "./SelectedUsers.module.css";

import { SelectedUserEmail } from "../SelectedUserEmail";
import { UserData } from "@/domain/user/user.entity";

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
