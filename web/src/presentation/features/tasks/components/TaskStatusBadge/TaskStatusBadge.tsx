import clsx from "clsx";

import type { TaskStatus } from "@/domain/models/TaskStatus";
import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./TaskStatusBadge.module.css";

interface TaskStatusBadgeProps {
  status?: TaskStatus;
  /** No handler — a small caption, as in the subtask rows (artboard B of stage 3) */
  onClick?: () => void;
}

/** Task status — a button that changes the status; color by status ID, as in the mockup. */
export function TaskStatusBadge({ status, onClick }: TaskStatusBadgeProps) {
  if (!onClick) {
    return (
      <span className={clsx("caption-med", styles.caption, status && styles[status.id])}>
        {status?.name ?? "…"}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={clsx(styles.badge, status && styles[status.id])}
      onClick={onClick}
      disabled={!status}
    >
      <span className="caption-med">{status?.name ?? "…"}</span>
      <Icon as={ICONS.downArrow} size="16px" inheritColor />
    </button>
  );
}
