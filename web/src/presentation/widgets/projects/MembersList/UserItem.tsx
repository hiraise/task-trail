import styles from "./UserItem.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface UserItemProps {
  username?: string;
  email: string;
}

export function UserItem({ username, email }: UserItemProps) {
  return (
    <div className={styles.userWrapper}>
      <div className={styles.avatarContainer}>
        <Icon as={ICONS.profile} size="20px" />
      </div>
      <div className={styles.userInfo}>
        <p className={styles.name}>{username ?? "No name"}</p>
        <p className={styles.email}>{email}</p>
      </div>
    </div>
  );
}
