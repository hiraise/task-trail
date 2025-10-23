import styles from "./AddParticipant.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { SubmitButton } from "@/presentation/ui/SubmitButton";

interface AddParticipantProps {
  onClick?: () => void;
}

export function AddParticipant({ onClick }: AddParticipantProps) {
  return (
    <SubmitButton className={styles.container} $variant="text" onClick={onClick}>
      <Icon as={ICONS.plus} size="24px" />
      <span className={styles.buttonText}>Пригласить участника</span>
    </SubmitButton>
  );
}
