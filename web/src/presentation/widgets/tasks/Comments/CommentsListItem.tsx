import styles from "./CommentsList.module.css";

import { TaskComment } from "@/domain/task/task.entity";
import CommentUserInfo from "./CommentUserInfo";
import { DropdownMenu } from "../../projects/DropdownMenu";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { useProjectMenuItems } from "@/application/projects/hooks/useProjectMenuItems";
import { formatDate } from "@/shared/utils/formatters";

interface CommentsListItemProps {
  comment: TaskComment;
}

export default function CommentsListItem({ comment }: CommentsListItemProps) {
  //TODO: replace menu items
  const { menuItems } = useProjectMenuItems(4);

  return (
    <div className={styles.container}>
      <div className={styles.user}>
        <CommentUserInfo
          user={comment.author}
          createdAt={formatDate(comment.createdAt)}
          updatedAt={comment.updatedAt ? formatDate(comment.updatedAt) : undefined}
        />
        <DropdownMenu trigger={<IconButton icon={ICONS.menu} size="24px" />} items={menuItems} />
      </div>
      <span>{comment.text}</span>
    </div>
  );
}
