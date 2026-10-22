import clsx from "clsx";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";
import type { ProjectId } from "@/domain/types";
import { IconButton } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectMenuButton } from "../ProjectMenuButton";

import styles from "./ProjectTasks.module.css";
import { TaskList } from "./TaskList";

interface ProjectTasksProps {
  projectId: ProjectId;
  tasks: Task[];
  members: ProjectMember[];
  className?: string;
}

/**
 * Задачи на странице проекта. На телефоне стрелка ведёт на страницу задач проекта,
 * шире — кнопка сортировки, список остаётся на месте.
 */
export function ProjectTasks({ projectId, tasks, members, className }: ProjectTasksProps) {
  const { showSortOptions } = useGlobalModals();
  const hasTasks = tasks.length > 0;

  return (
    <section className={clsx(styles.container, className)} aria-label={TEXTS.projects.tasks}>
      <div className={styles.title}>
        <div className={styles.phoneOnly}>
          <ProjectMenuButton
            to="/projects/$id/tasks"
            params={{ id: projectId }}
            text={TEXTS.projects.tasks}
            showButton={hasTasks}
          />
        </div>
        <div className={clsx(styles.wideOnly, styles.wideTitle)}>
          <h4>{TEXTS.projects.tasks}</h4>
          {hasTasks && <IconButton icon={ICONS.sort} size="24px" onClick={showSortOptions} />}
        </div>
      </div>
      {hasTasks ? (
        <TaskList tasks={tasks} members={members} />
      ) : (
        <div className={styles.empty} role="status">
          <p className="caption-reg">{TEXTS.projects.noTasks}</p>
        </div>
      )}
    </section>
  );
}
