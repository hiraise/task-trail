import styles from "./UserItem.module.css";
import { UserData } from "../AddParticipantForm/AddParticipantForm";
import { UserItem } from "./UserItem";
import { CheckBox } from "@/presentation/ui/CheckBox";

interface UserItemCheckBoxProps {
  user: UserData;
  isSelected?: boolean;
  onSelect?: (user: UserData) => void;
}

export function UserItemCheckBox({
  user,
  isSelected = false,
  onSelect,
}: UserItemCheckBoxProps) {
  const handleCheckboxChange = () => {
    if (onSelect) onSelect(user);
  };

  return (
    <div className={styles.container}>
      <UserItem email={user.email} />
      <CheckBox checked={isSelected} onChange={handleCheckboxChange} />
    </div>
  );
}
