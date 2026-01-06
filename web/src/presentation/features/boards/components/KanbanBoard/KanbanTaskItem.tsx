import clsx from "clsx";
import { forwardRef } from "react";

import { getProjectId } from "@/shared/utils/formatters";

import type { MockTask } from "./KanbanBoard.mocks";
import styles from "./KanbanTask.module.css";


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

    //TODO: Add project name for taskId

    return (
      <div className={styles.container} ref={ref} style={style} {...props}>
        <span className={clsx("caption-med", styles.taskId)}>
          {getProjectId("Project") + task.id}
        </span>
        <span className="multiline-3">{task.text}</span>
      </div>
    );
  },
);

KanbanTaskItem.displayName = "KanbanTaskItem";
