import { CheckBox } from "@/presentation/shared";

import { UserItem } from "./UserItem";
import styles from "./UserItem.module.css";

interface UserItemCheckBoxProps {
  email: string;
  isSelected?: boolean;
  onSelect?: (email: string) => void;
}

export function UserItemCheckBox({ email, isSelected = false, onSelect }: UserItemCheckBoxProps) {
  const handleCheckboxChange = () => {
    if (onSelect) onSelect(email);
  };

  return (
    <div className={styles.container}>
      <UserItem email={email} />
      <CheckBox checked={isSelected} onChange={handleCheckboxChange} />
    </div>
  );
}
