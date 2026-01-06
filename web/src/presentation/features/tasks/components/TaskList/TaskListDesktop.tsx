import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import { EmptyListState } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ASSETS } from "@/shared/config/assets";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";
import { getProjectId, getUserInitials } from "@/shared/utils/formatters";

import styles from "./TaskListDesktop.module.css";

interface TaskListProps {
  data: TaskDetailResponseDto[];
}

export function TaskListDesktop({ data }: TaskListProps) {
  const { showCreateTask } = useGlobalModals();

  if (data.length === 0)
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
      {data.map((data) => (
        <Link key={data.task.id} href={ROUTES.task(data.task.id)}>
          <TaskItemDesktop data={data} />
        </Link>
      ))}
    </div>
  );
}

function TaskItemDesktop({ data }: { data: TaskDetailResponseDto }) {
  const { task, project, assignee } = data;

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
