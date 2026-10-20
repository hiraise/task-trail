import { DESIGN_ELEMENTS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";
import { interpolate } from "@/shared/utils/interpolate";

import { Icon } from "../../ui";

import styles from "./Actions.module.css";
import type { ActionProps } from "./Actions.types";

export function MoveToArchive({ name, type }: ActionProps) {
  let description: string = "";

  if (type === "task") {
    description = interpolate(TEXTS.moveToArchive.task, { taskName: name });
  } else if (type === "project") {
    description = interpolate(TEXTS.moveToArchive.project, { projectName: name });
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
