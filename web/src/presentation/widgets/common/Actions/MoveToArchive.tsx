import styles from "./Actions.module.css";

import { interpolate } from "@/shared/utils/interpolate";
import { TEXTS } from "@/shared/locales/texts";
import { Icon } from "@/presentation/ui/Icon";
import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";
import { ActionProps } from "./Actions.types";

export function MoveToArchive({ name, type }: ActionProps) {
  let description: string;
  switch (type) {
    case "task":
      description = interpolate(TEXTS.moveToArchive.task, { taskName: name });
      break;
    case "project":
      description = interpolate(TEXTS.moveToArchive.project, { projectName: name });
      break;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{TEXTS.moveToArchive.title}</h2>
        <Icon as={DESIGN_ELEMENTS.archive} size="32px" />
      </div>
      <span className="body-reg">{description}</span>
    </div>
  );
}
