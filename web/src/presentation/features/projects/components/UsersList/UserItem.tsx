import { UserAvatar } from "@/presentation/shared";

import styles from "./UserItem.module.css";

interface UserItemProps {
  email: string;
  username?: string | null;
  avatarUrl?: string;
}

/** Кандидат в участники: аватарка, имя и почта; новая почта — только адрес. */
export function UserItem({ email, username, avatarUrl }: UserItemProps) {
  const name = username?.trim();

  return (
    <div className={styles.userInfo}>
      <UserAvatar src={avatarUrl} name={name || email} />
      <div className={styles.text}>
        {name && <p className={styles.name}>{name}</p>}
        <p className={name ? styles.secondary : styles.email}>{email}</p>
      </div>
    </div>
  );
}
