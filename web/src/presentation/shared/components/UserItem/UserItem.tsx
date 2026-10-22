import { UserAvatar } from "../UserAvatar";

import styles from "./UserItem.module.css";

interface UserItemProps {
  email: string;
  username?: string | null;
  avatarUrl?: string;
}

/** A member candidate: avatar, name and email; a new email shows only the address. */
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
