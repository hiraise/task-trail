import styles from "./SelectedUserEmail.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { UserData } from "../AddParticipantForm/AddParticipantForm";

interface SelectedUserEmailProps {
  email: string;
  onClick: (user: UserData) => void;
}

export function SelectedUserEmail({ email, onClick }: SelectedUserEmailProps) {
  const handleIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onClick({ email });
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
