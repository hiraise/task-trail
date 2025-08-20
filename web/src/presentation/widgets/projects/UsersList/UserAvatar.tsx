import styles from "./UserItem.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

export function UserAvatar() {
  return (
    <div className={styles.avatarContainer}>
      <Icon as={ICONS.profile} size="18px" />
    </div>
  );
}
