import clsx from "clsx";
import type { ReactNode } from "react";

import type { Task } from "@/domain/models/Task";

import { PriorityIcon } from "../PriorityIcon";

import styles from "./TaskMeta.module.css";

/**
 * The badges under a task name in every card (artboard A of stage 3): priority now; due date,
 * subtasks and labels are added by later steps. Nothing to show — renders nothing.
 */
export function TaskMeta({ task, className }: { task: Task; className?: string }) {
  const items: ReactNode[] = [];

  if (task.priority !== "normal") {
    items.push(<PriorityIcon key="priority" priority={task.priority} size="16px" />);
  }
  if (items.length === 0) return null;

  // A span: the line sits inside the span.text of ProjectTask and the "My tasks" card
  return <span className={clsx("caption-reg", styles.meta, className)}>{items}</span>;
}
