import { isTaskArchived } from "@/domain/models/Task";
import { Dialog, IconButton, type BaseModalProps } from "@/presentation/shared";
import { useScrollLock } from "@/presentation/shared/hooks";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { TaskModalProps } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { hasErrorCode } from "@/shared/errors/types";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";

import { TaskActivity, TaskAttachments, TaskInfo, TaskSubtasks } from "../../components";
import { useTaskDetail, useTaskMenuItems } from "../../hooks";

import styles from "./TaskModal.module.css";

/**
 * A task over the kanban from 1024 px (frames 1892:103887, 1892:104765): the same info and feed
 * as the task page. Narrower screens open the page instead, so this is always a dialog.
 */
export function TaskModal({ isOpen, onClose }: BaseModalProps) {
  const { taskId } = useGlobalModalProps<TaskModalProps>() ?? { taskId: "" };
  const { data, error } = useTaskDetail(taskId);
  const { menuItems } = useTaskMenuItems(data?.task);

  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <Dialog wide onDismiss={() => onClose()}>
      <div className={styles.close}>
        <IconButton icon={ICONS.close} onClick={() => onClose()} aria-label={TEXTS.close} />
      </div>
      <div className={styles.body}>
        {data && (
          <>
            <section className={styles.info}>
              <TaskInfo
                task={data.task}
                project={data.project}
                status={data.status}
                assignee={data.assignee}
                menuItems={menuItems}
              />
            </section>
            <TaskSubtasks
              task={data.task}
              readOnly={isTaskArchived(data.task)}
              className={styles.subtasks}
            />
            <TaskAttachments
              task={data.task}
              role={data.project.role}
              readOnly={isTaskArchived(data.task)}
              className={styles.attachments}
            />
            <section className={styles.activity}>
              <TaskActivity task={data.task} role={data.project.role} />
            </section>
          </>
        )}
        {!data && error && (
          <p className="body-reg-2" role="status">
            {hasErrorCode(error, "NOT_FOUND") ? tasksTexts.notFound : tasksTexts.loadFailed}
          </p>
        )}
        {!data && !error && <div className={styles.loading} aria-busy="true" />}
      </div>
    </Dialog>
  );
}
