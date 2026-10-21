import { UserAvatar } from "@/presentation/shared";

import styles from "./UserItem.module.css";

interface UserItemProps {
  email: string;
}

export function UserItem({ email }: UserItemProps) {
  return (
    <div className={styles.userInfo}>
      <UserAvatar />
      <p className={styles.email}>{email}</p>
    </div>
  );
}
