import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";
import styles from "./LeaveProject.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { TEXTS } from "@/shared/locales/texts";
import { interpolate } from "@/shared/utils/interpolate";

export function LeaveProject({ name }: { name: string }) {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>{TEXTS.projects.leave}</h2>
        <Icon as={DESIGN_ELEMENTS.leave} size="32px" />
      </div>
      <span className="body-reg">
        {name && interpolate(TEXTS.projects.deleteDescription, { projectName: name })}
      </span>
    </div>
  );
}
