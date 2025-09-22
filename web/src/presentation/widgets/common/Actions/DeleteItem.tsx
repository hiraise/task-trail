import styles from "./Actions.module.css";

import { interpolate } from "@/shared/utils/interpolate";
import { TEXTS } from "@/shared/locales/texts";
import { Icon } from "@/presentation/ui/Icon";
import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";
import { ActionProps } from "./Actions.types";

export function DeleteItem({ name, type }: ActionProps) {
  let description: string;
  switch (type) {
    case "task":
      description = interpolate(TEXTS.tasks.deleteDescription, { taskName: name });
      break;
    case "project":
      description = interpolate(TEXTS.projects.deleteDescription, { projectName: name });
      break;
  }
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{TEXTS.tasks.deleteTitle}</h2>
        <Icon as={DESIGN_ELEMENTS.delete} size="32px" />
      </div>
      <span className="body-reg">{description}</span>
    </div>
  );
}
