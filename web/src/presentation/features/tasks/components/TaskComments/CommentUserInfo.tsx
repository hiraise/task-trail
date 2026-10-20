import type { User } from "@/domain/models/User";
import { UserAvatar } from "@/presentation/shared";

import styles from "./CommentUserInfo.module.css";

interface CommentUserInfoProps {
  user: User;
  createdAt: string;
  updatedAt?: string;
}

export default function CommentUserInfo({ user, createdAt, updatedAt }: CommentUserInfoProps) {
  const getDate = () => {
    let retVal = createdAt;

    if (updatedAt) retVal += ` (edited: ${updatedAt})`;

    return retVal;
  };

  return (
    <div className={styles.container}>
      <UserAvatar />
      <div className={styles.infoWrapper}>
        <span className={styles.name}>{user.username}</span>
        <span className={styles.date}>{getDate()}</span>
      </div>
    </div>
  );
}
