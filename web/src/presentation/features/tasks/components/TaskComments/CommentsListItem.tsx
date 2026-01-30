import type { TaskComment } from "@/domain/models/TaskComment";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { formatDate } from "@/shared/utils/formatters";

import styles from "./CommentsList.module.css";
import CommentUserInfo from "./CommentUserInfo";

export default function CommentsListItem({ comment }: { comment: TaskComment }) {
  //TODO: implement menu items

  return (
    <div className={styles.container}>
      <div className={styles.user}>
        <CommentUserInfo
          user={comment.author}
          createdAt={formatDate(comment.createdAt)}
          updatedAt={comment.updatedAt ? formatDate(comment.updatedAt) : undefined}
        />
        <DropdownMenu trigger={<IconButton icon={ICONS.menu} size="24px" />} items={[]} />
      </div>
      <span>{comment.text}</span>
    </div>
  );
}
