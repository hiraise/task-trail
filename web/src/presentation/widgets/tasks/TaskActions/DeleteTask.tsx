import styles from "./TaskActions.module.css";

import { interpolate } from "@/shared/utils/interpolate";
import { TEXTS } from "@/shared/locales/texts";
import { Icon } from "@/presentation/ui/Icon";
import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";

export function DeleteTask({ taskName }: { taskName?: string }) {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{TEXTS.tasks.deleteTitle}</h2>
        <Icon as={DESIGN_ELEMENTS.delete} size="32px" />
      </div>
      <span className="body-reg">
        {taskName &&
          interpolate(TEXTS.tasks.deleteDescription, {
            taskName: taskName,
          })}
      </span>
    </div>
  );
}
