import { forwardRef } from "react";
import clsx from "clsx";

import styles from "./KanbanTask.module.css";

import { MockTask } from "./KanbanBoard.mocks";
import { getProjectId } from "@/shared/utils/formatters";

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
  }
);

KanbanTaskItem.displayName = "KanbanTaskItem";
