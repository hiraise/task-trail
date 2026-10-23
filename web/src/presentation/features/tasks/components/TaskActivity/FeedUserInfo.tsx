import { getUserDisplayName, type User } from "@/domain/models/User";
import { UserAvatar } from "@/presentation/shared";
import { tasksTexts } from "@/shared/locales/tasks";
import { formatDate } from "@/shared/utils/formatters";

import styles from "./FeedUserInfo.module.css";

interface FeedUserInfoProps {
  user: User;
  /** ISO 8601 */
  createdAt: string;
  edited?: boolean;
}

/** Avatar, name and date of a feed item; an "edited" mark for an edited comment. */
export function FeedUserInfo({ user, createdAt, edited }: FeedUserInfoProps) {
  const name = getUserDisplayName(user);

  return (
    <div className={styles.container}>
      <UserAvatar src={user.avatarUrl} name={name} />
      <div className={styles.infoWrapper}>
        <span className={styles.name}>{name}</span>
        <span className={styles.date}>
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
          {edited && <span className={styles.edited}>{tasksTexts.comments.edited}</span>}
        </span>
      </div>
    </div>
  );
}
