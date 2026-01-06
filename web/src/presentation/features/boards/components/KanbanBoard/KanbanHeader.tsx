import clsx from "clsx";

import styles from "./KanbanHeader.module.css";

interface KanbanHeaderProps {
  name: string;
  taskCount: number;
}

export function KanbanHeader({ name, taskCount }: KanbanHeaderProps) {
  return (
    <div className={styles.container}>
      <span className="body-med-2">{name}</span>
      {taskCount > 0 && (
        <span className={clsx("caption-2-med", styles.counterBg)}>{taskCount}</span>
      )}
    </div>
  );
}
