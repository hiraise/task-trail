import Image from "next/image";
import clsx from "clsx";

import styles from "./TaskListDesktop.module.css";

import { Task } from "@/domain/task/task.entity";
import { useGetTaskListData } from "@/application/tasks/hooks/useGetTaskListData";
import { getProjectId, getUserInitials } from "@/shared/utils/formatters";
import Link from "next/link";
import { ROUTES } from "@/infrastructure/config/routes";
import { EmptyListState } from "../../common/EmptyListState/EmptyListState";
import { ASSETS } from "@/infrastructure/config/assets";
import { TEXTS } from "@/shared/locales/texts";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

interface TaskListProps {
  tasks: Task[];
}

export function TaskListDesktop({ tasks }: TaskListProps) {
  const { showCreateTask } = useGlobalModals();

  if (tasks.length === 0)
    return (
      <EmptyListState
        src={ASSETS.images.task}
        alt={TEXTS.tasks.taskAlt}
        text={TEXTS.tasks.empty}
        btnLabel={TEXTS.tasks.createButton}
        onClick={showCreateTask}
      />
    );

  return (
    <div className={styles.container}>
      {tasks.map((t) => (
        <Link key={t.id} href={ROUTES.task(t.id)}>
          <TaskItemDesktop task={t} />
        </Link>
      ))}
    </div>
  );
}

function TaskItemDesktop({ task }: { task: Task }) {
  const { getProjectById, getUserById } = useGetTaskListData();
  const project = getProjectById(task.projectId);
  const assignee = getUserById(task.assigneeId);

  if (!project) return null;

  return (
    <div className={styles.taskItemWrapper}>
      <div className={styles.title}>
        <span className={clsx(styles.taskId, "caption-med")}>
          {getProjectId(project.name) + task.id}
        </span>
        <span className="body-med">{task.title}</span>
      </div>
      {assignee && (
        <div className={styles.avatarWrapper}>
          {assignee.avatarUrl && <Image src={assignee.avatarUrl} fill alt="User avatar" />}
          {!assignee.avatarUrl && (
            <span className="caption-2-reg">{getUserInitials(assignee.username)}</span>
          )}
        </div>
      )}
    </div>
  );
}
