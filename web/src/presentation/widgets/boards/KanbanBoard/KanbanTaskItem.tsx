import { forwardRef } from "react";

import styles from "./KanbanTask.module.css";
import { MockTask } from "./KanbanBoard.mocks";

interface KanbanTaskItemProps {
  task: MockTask;
  dragging?: boolean;
  extraStyle?: React.CSSProperties;
}

export const KanbanTaskItem = forwardRef<HTMLDivElement, KanbanTaskItemProps>(
  ({ task, dragging = false, extraStyle = {}, ...props }, ref) => {
    const style: React.CSSProperties = {
      ...extraStyle,
      cursor: dragging ? "grabbing" : "grab",
      opacity: dragging ? 0.5 : 1,
    };

    return (
      <div className={styles.container} ref={ref} style={style} {...props}>
        <div className={styles.handle} />
        <span>{task.text}</span>
      </div>
    );
  }
);

KanbanTaskItem.displayName = "KanbanTaskItem";
