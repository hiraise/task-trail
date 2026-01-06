import { IconButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./SelectedUserEmail.module.css";

interface SelectedUserEmailProps {
  email: string;
  onClick: (email: string) => void;
}

export function SelectedUserEmail({ email, onClick }: SelectedUserEmailProps) {
  const handleIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(email);
  };

  return (
    <div className={styles.container}>
      <p className={styles.text}>{email}</p>
      <IconButton
        icon={ICONS.close}
        size="16px"
        onClick={handleIconClick}
        className={styles.icon}
      />
    </div>
  );
}
