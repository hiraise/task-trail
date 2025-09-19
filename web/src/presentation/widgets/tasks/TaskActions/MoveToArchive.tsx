import styles from "./TaskActions.module.css";

import { interpolate } from "@/shared/utils/interpolate";
import { TEXTS } from "@/shared/locales/texts";
import { Icon } from "@/presentation/ui/Icon";
import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";

export function MoveToArchive({ taskName }: { taskName?: string }) {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{TEXTS.moveToArchive.title}</h2>
        <Icon as={DESIGN_ELEMENTS.archive} size="32px" />
      </div>
      <span className="body-reg">
        {taskName &&
          interpolate(TEXTS.moveToArchive.task, {
            taskName: taskName,
          })}
      </span>
    </div>
  );
}
