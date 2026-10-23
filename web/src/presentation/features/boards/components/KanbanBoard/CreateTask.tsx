import clsx from "clsx";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";

import styles from "./KanbanBoard.module.css";

interface CreateTaskProps {
  /** "Create task" with text in an empty cell, a "+" after the cards (comments 980:37533, 980:37537) */
  withText: boolean;
  onClick: () => void;
}

export function CreateTask({ withText, onClick }: CreateTaskProps) {
  return (
    <button
      type="button"
      className={clsx("caption-reg", styles.create)}
      onClick={onClick}
      aria-label={withText ? undefined : tasksTexts.buttonText}
    >
      <Icon as={ICONS.plus} size="16px" />
      {withText && <span>{tasksTexts.buttonText}</span>}
    </button>
  );
}
