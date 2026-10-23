import type { TaskEvent } from "@/domain/models/TaskEvent";

import { describeEvent } from "./feed";
import styles from "./FeedItem.module.css";
import { FeedUserInfo } from "./FeedUserInfo";

interface EventItemProps {
  event: TaskEvent;
  statusName: Parameters<typeof describeEvent>[1];
}

/** A history line: who and when, the change in grey; events have no menu (ADR-0028). */
export function EventItem({ event, statusName }: EventItemProps) {
  return (
    <article className={styles.item}>
      <div className={styles.header}>
        <FeedUserInfo user={event.actor} createdAt={event.createdAt} />
      </div>
      <p className={styles.event}>{describeEvent(event, statusName)}</p>
    </article>
  );
}
