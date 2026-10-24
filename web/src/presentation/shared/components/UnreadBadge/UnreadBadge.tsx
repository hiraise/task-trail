import clsx from "clsx";

import { notificationsTexts } from "@/shared/locales/notifications";
import { interpolate } from "@/shared/utils/interpolate";

import styles from "./UnreadBadge.module.css";

const MAX_SHOWN = 99;

interface UnreadBadgeProps {
  count: number;
  /** Placement: on an icon corner the caller adds the ring of the background color */
  className?: string;
}

/** The unread notifications counter (ADR-0038): nothing for 0, «99+» above 99. */
export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={clsx(styles.badge, className)}
      role="img"
      aria-label={interpolate(notificationsTexts.unreadCount, { count: String(count) })}
    >
      {count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}
    </span>
  );
}
