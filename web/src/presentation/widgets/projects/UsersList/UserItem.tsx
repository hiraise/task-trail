import styles from "./UserItem.module.css";
import { UserData } from "../AddParticipantForm/AddParticipantForm";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { CheckBox } from "@/presentation/ui/CheckBox";

interface UserItemProps {
  user: UserData;
  isSelected?: boolean;
  onSelect?: (user: UserData) => void;
}

export function UserItem({
  user,
  isSelected = false,
  onSelect,
}: UserItemProps) {
  const handleToggle = () => {
    if (onSelect) onSelect(user);
  };

  return (
    <div
      className={styles.container}
      onClick={handleToggle}
      style={{ cursor: onSelect ? "pointer" : "default" }}
    >
      <div className={styles.userInfo}>
        <div className={styles.avatarContainer}>
          <Icon as={ICONS.profile} size="18px" />
        </div>
        <p className={styles.email}>{user.email}</p>
      </div>
      <CheckBox checked={isSelected} onChange={() => handleToggle()} />
    </div>
  );
}
