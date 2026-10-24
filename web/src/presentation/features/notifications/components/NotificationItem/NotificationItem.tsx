import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import type { Notification } from "@/domain/models/Notification";
import { Icon, UserAvatar } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { notificationsTexts } from "@/shared/locales/notifications";
import { formatDateTime } from "@/shared/utils/formatters";

import { notificationParts, type StatusName } from "../../describe";

import styles from "./NotificationItem.module.css";

interface NotificationItemProps {
  notification: Notification;
  statusName: StatusName;
  /** Called on a click before the task opens: marks the notification read */
  onOpen: (notification: Notification) => void;
}

/**
 * A row of the notifications page (stage 3 mockups, artboard F): the actor or a calendar for
 * reminders, the sentence, the comment start, the task and the time. Unread — a gray background
 * and a dot. A click opens the task.
 */
export function NotificationItem({ notification: n, statusName, onOpen }: NotificationItemProps) {
  const { actor, rest } = notificationParts(n, statusName);
  const unread = !n.readAt;
  const showText = (n.kind === "commented" || n.kind === "mentioned") && !!n.text;

  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: n.task.id }}
      className={clsx(styles.row, unread && styles.unread)}
      onClick={() => onOpen(n)}
    >
      {n.actor ? (
        <UserAvatar src={n.actor.avatarUrl} name={actor} />
      ) : (
        <span className={clsx(styles.reminder, n.kind === "overdue" && styles.overdue)}>
          <Icon as={ICONS.calendar} size="20px" inheritColor />
        </span>
      )}
      <span className={styles.body}>
        <span className={styles.sentence}>
          {actor && <span className={styles.actor}>{actor}</span>}
          {rest}
        </span>
        {showText && <span className={clsx(styles.text, styles.oneLine)}>{n.text}</span>}
        <span className={clsx(styles.caption, styles.oneLine)}>
          {n.task.key} · {n.task.name}
        </span>
        <span className={styles.caption}>{formatDateTime(n.createdAt)}</span>
      </span>
      {unread && <span className={styles.dot} role="img" aria-label={notificationsTexts.unread} />}
    </Link>
  );
}
