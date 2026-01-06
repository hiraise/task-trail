import type { TaskCommentResponseDto } from "@/application/dto/TaskCommentResponseDto";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { formatDate } from "@/shared/utils/formatters";

import styles from "./CommentsList.module.css";
import CommentUserInfo from "./CommentUserInfo";

interface CommentsListItemProps {
  comment: TaskCommentResponseDto;
}

export default function CommentsListItem({ comment }: CommentsListItemProps) {
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
