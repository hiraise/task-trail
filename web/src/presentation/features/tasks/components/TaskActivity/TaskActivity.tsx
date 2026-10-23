import { useMemo } from "react";

import { isTaskArchived, type Task } from "@/domain/models/Task";
import type { ProjectRole } from "@/domain/types";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { tasksTexts } from "@/shared/locales/tasks";

import { useCreateComment, useTaskComments, useTaskEvents, useTaskStatuses } from "../../hooks";

import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import { EventItem } from "./EventItem";
import { buildFeed } from "./feed";
import styles from "./TaskActivity.module.css";
import listStyles from "./FeedItem.module.css";

interface TaskActivityProps {
  task: Task;
  /** The current user's role in the task's project */
  role: ProjectRole;
}

/**
 * The task feed (ADR-0028): comments and change history in one list, newest on top. An archived
 * task has no input and no comment menus (ADR-0027).
 */
export function TaskActivity({ task, role }: TaskActivityProps) {
  const readOnly = isTaskArchived(task);
  const comments = useTaskComments(task.id);
  const events = useTaskEvents(task.id);
  const { data: statuses } = useTaskStatuses();
  const { data: me } = useGetCurrentUser();
  const { mutateAsync: create } = useCreateComment(task.id);

  const feed = useMemo(
    () => (comments.data && events.data ? buildFeed(comments.data, events.data) : undefined),
    [comments.data, events.data],
  );
  const statusName = (id: string) => statuses?.find((status) => status.id === id)?.name ?? id;

  return (
    <div className={styles.container}>
      <h4>{tasksTexts.comments.title}</h4>
      {!readOnly && <CommentInput submitText={tasksTexts.comments.send} onSubmit={create} />}
      {comments.error || events.error ? (
        <p className={`body-reg-2 ${styles.status}`} role="status">
          {tasksTexts.comments.loadFailed}
        </p>
      ) : (
        <div className={listStyles.list} aria-busy={!feed}>
          {feed?.map((item) =>
            item.type === "comment" ? (
              <CommentItem
                key={item.id}
                comment={item.comment}
                userId={me?.id}
                role={role}
                readOnly={readOnly}
              />
            ) : (
              <EventItem key={item.id} event={item.event} statusName={statusName} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
