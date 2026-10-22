import { Icon, SubmitButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./AddParticipant.module.css";

interface AddParticipantProps {
  onClick?: () => void;
}

export function AddParticipant({ onClick }: AddParticipantProps) {
  return (
    // type="button": кнопка внутри формы проекта и не должна её отправлять
    <SubmitButton type="button" className={styles.container} variant="text" onClick={onClick}>
      <Icon as={ICONS.plus} size="24px" />
      <span className={styles.buttonText}>Пригласить участника</span>
    </SubmitButton>
  );
}
