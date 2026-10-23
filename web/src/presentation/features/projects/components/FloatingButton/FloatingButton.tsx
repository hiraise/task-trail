import type { ProjectId } from "@/domain/types";
import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { useOpenCreateTask } from "../../../tasks/hooks";

import styles from "./FloatingButton.module.css";

interface FloatingButtonProps {
  /** The project page: the form opens with this project preselected */
  projectId?: ProjectId;
  /** A board: only its projects can be chosen (ADR-0029) */
  allowedProjectIds?: ProjectId[];
}

/** "Create task" on a project or board page. */
export function FloatingButton({ projectId, allowedProjectIds }: FloatingButtonProps) {
  const openCreateTask = useOpenCreateTask();

  return (
    <button
      type="button"
      className={styles.container}
      onClick={() => openCreateTask(projectId, allowedProjectIds)}
    >
      <span className="btn-font-m">{TEXTS.tasks.createButton}</span>
      <div className={styles.icon}>
        <Icon as={ICONS.plus} size="32px" inheritColor />
      </div>
    </button>
  );
}
