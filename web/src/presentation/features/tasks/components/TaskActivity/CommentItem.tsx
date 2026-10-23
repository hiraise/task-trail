import { useState } from "react";

import { isCommentEditable, type TaskComment } from "@/domain/models/TaskComment";
import type { ProjectRole } from "@/domain/types";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";
import { linkify } from "@/shared/utils/linkify";
import { canDeleteComment } from "@/shared/utils/userRole";

import { useDeleteComment, useEditComment } from "../../hooks";

import { CommentInput } from "./CommentInput";
import styles from "./FeedItem.module.css";
import { FeedUserInfo } from "./FeedUserInfo";

interface CommentItemProps {
  comment: TaskComment;
  /** The current user's ID and role in the task's project */
  userId?: string;
  role: ProjectRole;
  /** The task is archived: comments are read-only (ADR-0027) */
  readOnly: boolean;
}

/**
 * A comment (frames 1152:75644, 1581:76985). Edit — the author during the first 24 hours,
 * delete — the author, the owner and admins (ADR-0028); without items there is no menu button.
 * Editing replaces the card with the field, as in frames 1161:75166 and 1892:103244.
 */
export function CommentItem({ comment, userId, role, readOnly }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const { mutateAsync: edit } = useEditComment(comment.taskId);
  const { mutate: remove } = useDeleteComment(comment.taskId);
  const { showConfirm } = useGlobalModals();
  const isAuthor = comment.author.id === userId;

  if (editing) {
    return (
      <CommentInput
        initialValue={comment.text}
        submitText={tasksTexts.comments.save}
        autoFocus
        onCancel={() => setEditing(false)}
        onSubmit={async (text) => {
          await edit({ commentId: comment.id, text });
          setEditing(false);
        }}
      />
    );
  }

  const menuItems: MenuItem[] = [
    {
      label: tasksTexts.comments.edit,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: () => setEditing(true),
      isVisible: !readOnly && isAuthor && isCommentEditable(comment),
    },
    {
      label: tasksTexts.comments.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        const confirmed = await showConfirm({
          title: tasksTexts.comments.deleteTitle,
          description: tasksTexts.comments.deleteDescription,
          confirmText: tasksTexts.comments.delete,
        });

        if (confirmed) remove(comment.id);
      },
      isVisible: !readOnly && canDeleteComment(role, isAuthor),
    },
  ].filter((item) => item.isVisible);

  return (
    <article className={styles.item}>
      <div className={styles.header}>
        <FeedUserInfo user={comment.author} createdAt={comment.createdAt} edited={!!comment.editedAt} />
        {menuItems.length > 0 && (
          <DropdownMenu trigger={<IconButton icon={ICONS.menu} size="24px" />} items={menuItems} />
        )}
      </div>
      <p className={styles.text}>{linkify(comment.text)}</p>
    </article>
  );
}
