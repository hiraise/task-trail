import styles from "./UserItem.module.css";

import { UserAvatar } from "../../common/UserAvatar";

interface UserItemProps {
  username?: string;
  email: string;
}

export function UserItem({ username, email }: UserItemProps) {
  return (
    <div className={styles.userWrapper}>
      <UserAvatar variant="large" />
      <div className={styles.userInfo}>
        <p className={styles.name}>{username ?? "No name"}</p>
        <p className={styles.email}>{email}</p>
      </div>
    </div>
  );
}
