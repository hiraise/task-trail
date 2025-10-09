import Link from "next/link";
import clsx from "clsx";
import { memo } from "react";

import styles from "./ProjectTasks.module.css";

import { Task } from "@/domain/task/task.entity";
import { ROUTES } from "@/infrastructure/config/routes";
import { TEXTS } from "@/shared/locales/texts";
import { ProjectTask } from "./ProjectTask";
import { ProjectMenuButton } from "../ProjectMenuButton";

interface ProjectTasksProps {
  projectId: number;
  tasks: Task[];
  className?: string;
}

/**
 * Renders a list of project tasks or an empty state if no tasks are available.
 * Uses semantic HTML and proper accessibility attributes for better UX.
 * Memoized for performance optimization.
 *
 * @param {ProjectTasksProps} props - The props for the ProjectTasks component.
 * @param {number} props.projectId - The unique identifier of the project.
 * @param {Array<Task>} props.tasks - An array of task objects to display.
 * @param {string} [props.className] - Optional additional CSS class for the container.
 *
 * @returns {JSX.Element} A section containing project tasks list or empty state.
 */
export const ProjectTasks = memo(function ProjectTasks({
  projectId,
  tasks,
  className,
}: ProjectTasksProps) {
  if (tasks.length === 0) {
    return (
      <section className={clsx(styles.container, className)} aria-label="Project tasks">
        <ProjectMenuButton
          href={ROUTES.projectTasks(projectId)}
          text={TEXTS.projects.tasks}
          showButton={false}
        />
        <div className={styles.empty} role="status" aria-live="polite">
          <p className="caption-reg">{TEXTS.projects.noTasks}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={clsx(styles.container, className)} aria-label="Project tasks">
      <ProjectMenuButton href={ROUTES.projectTasks(projectId)} text={TEXTS.projects.tasks} />
      <ul role="list" className={styles.list}>
        {tasks.map((task) => (
          <li key={task.id}>
            <Link href={ROUTES.task(task.id)}>
              <ProjectTask title={task.title} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
});
