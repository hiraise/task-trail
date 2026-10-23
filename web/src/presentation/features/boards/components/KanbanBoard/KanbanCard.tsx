import { useDraggable } from "@dnd-kit/core";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { forwardRef } from "react";

import type { Task } from "@/domain/models/Task";

import styles from "./KanbanCard.module.css";

interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  task: Task;
  /** The dragged card's place: where it lands (comment 1010:42111) */
  placeholder?: boolean;
  /** The card under the pointer while dragging: a full outline and a shadow */
  lifted?: boolean;
}

/**
 * A kanban card: the key as a caption and the name, up to three lines. The key leads to the task
 * page; the rest of the card opens the task (comment 1888:101344).
 */
export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ task, placeholder = false, lifted = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(styles.card, placeholder && styles.placeholder, lifted && styles.lifted, className)}
      {...props}
    >
      <Link
        to="/tasks/$taskId"
        params={{ taskId: task.id }}
        className={clsx("caption-2-reg", styles.key)}
        onClick={(event) => event.stopPropagation()}
        // Not a drag handle: a press on the key is a link
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        tabIndex={-1}
      >
        {task.key}
      </Link>
      <span className={clsx("body-reg-2", "multiline-3", styles.name)}>{task.name}</span>
    </div>
  ),
);

KanbanCard.displayName = "KanbanCard";

interface DraggableCardProps {
  task: Task;
  /** The card's requests are running: it is not dragged again until they finish */
  disabled: boolean;
  onOpen: (task: Task) => void;
}

/** A card that can be dragged to another column or swimlane. */
export function DraggableCard({ task, disabled, onOpen }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled,
  });

  return (
    <KanbanCard
      ref={setNodeRef}
      task={task}
      placeholder={isDragging}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        // Enter opens the task, Space picks the card up (the keyboard sensor of dnd-kit)
        if (event.key === "Enter" && !isDragging) onOpen(task);
        else listeners?.onKeyDown?.(event);
      }}
    />
  );
}
