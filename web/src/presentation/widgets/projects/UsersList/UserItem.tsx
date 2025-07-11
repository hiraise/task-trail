import styles from "./UserItem.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface UserItemProps {
  email: string;
}

export function UserItem({ email }: UserItemProps) {
  return (
    <div className={styles.userInfo}>
      <div className={styles.avatarContainer}>
        <Icon as={ICONS.profile} size="18px" />
      </div>
      <p className={styles.email}>{email}</p>
    </div>
  );
}
