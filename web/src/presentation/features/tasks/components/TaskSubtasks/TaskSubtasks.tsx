import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { useState, type FormEvent, type KeyboardEvent } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";
import type { TaskStatus } from "@/domain/models/TaskStatus";
import { getUserDisplayName } from "@/domain/models/User";
import { ArchiveTag, Icon, Input, SubmitButton, UserAvatar } from "@/presentation/shared";
import { taskNameField } from "@/presentation/shared/forms/fields";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";
import { interpolate } from "@/shared/utils/interpolate";

import { useProjectMembers } from "../../../projects/hooks";
import { useCreateSubtask, useSubtasks, useTaskStatuses } from "../../hooks";
import { TaskStatusBadge } from "../TaskStatusBadge";

import styles from "./TaskSubtasks.module.css";

interface TaskSubtasksProps {
  task: Task;
  /** An archived task: rows stay links, nothing is added */
  readOnly: boolean;
  /** The card around the block: the page section or the modal section */
  className?: string;
}

/**
 * The subtasks block between the task info and the feed (artboard B of stage 3, ADR-0036): progress,
 * rows linking to the subtasks and quick adding. One level: a subtask has no block of its own.
 */
export function TaskSubtasks({ task, readOnly, className }: TaskSubtasksProps) {
  const isSubtask = !!task.parentId;
  const { data: subtasks } = useSubtasks(task.id, { enabled: !isSubtask });
  const { data: members } = useProjectMembers(isSubtask ? "" : task.projectId);
  const { data: statuses } = useTaskStatuses();
  const [adding, setAdding] = useState(false);

  if (isSubtask) return null;

  return (
    <section className={clsx(styles.block, className)} aria-label={tasksTexts.subtasks}>
      <div className={styles.header}>
        <h4>{tasksTexts.subtasks}</h4>
        {task.subtasksTotal > 0 && (
          <span className={clsx("body-reg-2", styles.secondary)}>
            {interpolate(tasksTexts.subtasksProgress, {
              done: String(task.subtasksDone),
              total: String(task.subtasksTotal),
            })}
          </span>
        )}
      </div>
      {subtasks && subtasks.length === 0 && (
        <p className={clsx("body-reg-2", styles.secondary)}>{tasksTexts.noSubtasks}</p>
      )}
      {subtasks && subtasks.length > 0 && (
        <ul className={styles.list}>
          {subtasks.map((subtask) => (
            <li key={subtask.id}>
              <SubtaskRow
                subtask={subtask}
                status={statuses?.find((status) => status.id === subtask.statusId)}
                assignee={members?.find((member) => member.id === subtask.assigneeId)}
              />
            </li>
          ))}
        </ul>
      )}
      {!readOnly &&
        (adding ? (
          <SubtaskForm parent={task} onClose={() => setAdding(false)} />
        ) : (
          <SubmitButton
            type="button"
            variant="text"
            className={clsx("btn-font-s", styles.add)}
            onClick={() => setAdding(true)}
          >
            <Icon as={ICONS.plus} size="24px" inheritColor aria-hidden />
            {tasksTexts.addSubtask}
          </SubmitButton>
        ))}
    </section>
  );
}

interface SubtaskRowProps {
  subtask: Task;
  status?: TaskStatus;
  assignee?: ProjectMember;
}

/** A link to the subtask: status (the archive tag for an archived one), key, name and assignee. */
function SubtaskRow({ subtask, status, assignee }: SubtaskRowProps) {
  const { closeAllModals } = useGlobalModals();

  return (
    // Inside the kanban TaskModal: close it, or it stays open over the subtask page
    <Link
      to="/tasks/$taskId"
      params={{ taskId: subtask.id }}
      className={styles.row}
      onClick={() => closeAllModals()}
    >
      <span className={styles.text}>
        <span className={styles.head}>
          {subtask.archivedAt ? <ArchiveTag /> : <TaskStatusBadge status={status} />}
          <span className={clsx("caption-reg", styles.secondary, styles.key)}>{subtask.key}</span>
        </span>
        <span className={clsx("body-reg-2", styles.name)}>{subtask.name}</span>
      </span>
      <UserAvatar
        variant="small"
        src={assignee?.avatarUrl}
        name={assignee && getUserDisplayName(assignee)}
      />
    </Link>
  );
}

/** Quick adding: the field stays open and clears after each subtask; Escape closes it. */
function SubtaskForm({ parent, onClose }: { parent: Task; onClose: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const { mutate: createSubtask, isPending } = useCreateSubtask();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = taskNameField.safeParse(name);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);

      return;
    }
    setError(undefined);
    createSubtask(
      { projectId: parent.projectId, name: parsed.data, parentId: parent.id },
      { onSuccess: () => setName("") },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    // The kanban TaskModal closes on Escape caught on window: only the field closes here
    event.stopPropagation();
    onClose();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.fieldRow}>
        <Input
          autoFocus
          value={name}
          placeholder={tasksTexts.subtaskNamePlaceholder}
          aria-label={tasksTexts.subtaskNamePlaceholder}
          aria-invalid={!!error}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <SubmitButton type="submit" className={clsx("btn-font-s", styles.create)} disabled={isPending}>
          {tasksTexts.createSubtaskButton}
        </SubmitButton>
      </div>
      {error && (
        <p className={clsx("caption-reg", styles.error)} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
