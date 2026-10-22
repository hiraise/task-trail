import type { User } from "@/domain/models/User";
import { CheckBox } from "@/presentation/shared";

import { UserItem } from "./UserItem";
import styles from "./UserItem.module.css";

interface UserItemCheckBoxProps {
  user: User;
  isSelected?: boolean;
  onSelect: (email: string) => void;
}

export function UserItemCheckBox({ user, isSelected = false, onSelect }: UserItemCheckBoxProps) {
  return (
    <div className={styles.container}>
      <UserItem email={user.email} username={user.username} avatarUrl={user.avatarUrl} />
      <CheckBox checked={isSelected} onChange={() => onSelect(user.email)} />
    </div>
  );
}
