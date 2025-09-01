import styles from "./CommentUserInfo.module.css";

import { User } from "@/domain/user/user.entity";
import { UserAvatar } from "../../common/UserAvatar";
import { getDisplayName } from "@/shared/utils/getDisplayName";

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
        <span className={styles.name}>{getDisplayName(user)}</span>
        <span className={styles.date}>{getDate()}</span>
      </div>
    </div>
  );
}
