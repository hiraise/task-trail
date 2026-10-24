import { useCallback } from "react";

import emptyImage from "@/assets/elements/notifications-empty.svg";
import type { Notification } from "@/domain/models/Notification";
import type { TaskStatusId } from "@/domain/types";
import { EmptyListState, SubmitButton } from "@/presentation/shared";
import { useTaskStatuses } from "@/presentation/shared/hooks";
import { notificationsTexts } from "@/shared/locales/notifications";

import { NotificationItem } from "../../components";
import { useNotifications, useReadAllNotifications, useSetNotificationRead } from "../../hooks";

import styles from "./NotificationsPage.module.css";

const PLACEHOLDER_ROWS = 6;

/**
 * Notifications of the current user (ADR-0038, artboard F). On a phone — a section screen with
 * the bottom bar; from 768 px — a header and a card in DesktopTemplate, like TasksPage.
 * Both headers are in the markup, CSS shows one.
 */
export function NotificationsPage() {
  const { data: notifications, isPending, isError } = useNotifications();
  const { data: statuses } = useTaskStatuses();
  const { mutate: setRead } = useSetNotificationRead();
  const { mutate: readAll, isPending: readingAll } = useReadAllNotifications();

  const statusName = useCallback(
    (id: TaskStatusId) => statuses?.find((status) => status.id === id)?.name ?? id,
    [statuses],
  );
  const open = useCallback(
    (n: Notification) => {
      if (!n.readAt) setRead({ id: n.id, read: true });
    },
    [setRead],
  );

  const hasUnread = !!notifications?.some((n) => !n.readAt);
  const readAllButton = (
    <SubmitButton
      variant="text"
      className={styles.readAll}
      disabled={!hasUnread || readingAll}
      onClick={() => readAll()}
    >
      <span className="btn-font-s">{notificationsTexts.readAll}</span>
    </SubmitButton>
  );

  const renderList = () => {
    if (isPending) return <Placeholders />;
    if (isError) return <p className={styles.error}>{notificationsTexts.loadFailed}</p>;
    if (notifications.length === 0) {
      return (
        <EmptyListState
          src={emptyImage}
          alt={notificationsTexts.empty}
          text={notificationsTexts.empty}
        />
      );
    }

    return (
      <ul className={styles.list}>
        {notifications.map((n) => (
          <li key={n.id}>
            <NotificationItem notification={n} statusName={statusName} onOpen={open} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.phoneTopBar}>
        <div className={styles.phoneTitle}>
          <h2>{notificationsTexts.title}</h2>
        </div>
      </div>
      <div className={styles.wideTopBar}>
        <h1 className="medium">{notificationsTexts.title}</h1>
        {readAllButton}
      </div>
      <div className={styles.content}>
        <div className={styles.phoneActions}>{readAllButton}</div>
        {renderList()}
      </div>
    </div>
  );
}

function Placeholders() {
  return (
    <div className={styles.list} aria-busy="true" aria-label={notificationsTexts.loading}>
      {Array.from({ length: PLACEHOLDER_ROWS }, (_, i) => (
        <div key={i} className={styles.placeholder}>
          <span className={styles.placeholderAvatar} />
          <span className={styles.placeholderLines}>
            <span />
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  );
}
