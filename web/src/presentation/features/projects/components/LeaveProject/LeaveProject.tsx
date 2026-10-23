import { Icon } from "@/presentation/shared";
import { DESIGN_ELEMENTS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";
import { TEXTS } from "@/shared/locales/texts";
import { interpolate } from "@/shared/utils/interpolate";

import styles from "./LeaveProject.module.css";

interface LeaveProjectProps {
  name: string;
  /** A board is left with the same confirmation (ADR-0029) */
  kind?: "project" | "board";
}

export function LeaveProject({ name, kind = "project" }: LeaveProjectProps) {
  const title = kind === "board" ? boardsTexts.leave : TEXTS.projects.leave;
  const description =
    kind === "board"
      ? interpolate(boardsTexts.leaveDescription, { boardName: name })
      : interpolate(TEXTS.projects.leaveDescription, { projectName: name });

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{title}</h2>
        <Icon as={DESIGN_ELEMENTS.leave} size="32px" />
      </div>
      <span className="body-reg">
        {name && description}
      </span>
    </div>
  );
}
