import styles from "./TaskInfo.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface TaskDependenciesItemProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function TaskDependenciesItem({ onClick, children }: TaskDependenciesItemProps) {
  return (
    <button className={styles.contentContainer} onClick={onClick}>
      <div className={styles.contentWrapper}>{children}</div>
      <Icon as={ICONS.downArrow} size="15px" />
    </button>
  );
}
