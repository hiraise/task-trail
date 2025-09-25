import Link from "next/link";
import clsx from "clsx";

import styles from "./ProjectDesktopPage.module.css";

import { useGetProjectData } from "@/application/projects/hooks/useGetProjectData";
import { ROUTES } from "@/infrastructure/config/routes";
import { BackButton } from "@/presentation/ui/BackButton";
import { ProjectInfo } from "@/presentation/widgets/projects/ProjectInfo";
import { TEXTS } from "@/shared/locales/texts";
import { ProjectTask } from "@/presentation/widgets/projects/ProjectTask";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { FloatingButtonDesktop } from "@/presentation/widgets/projects/FloatingButton";
import { Task } from "@/domain/task/task.entity";
import { ProjectMembers } from "@/presentation/widgets/projects/ProjectMembers";

export function ProjectDesktopPage() {
  const { project, tasks, members } = useGetProjectData();

  if (!project || !tasks) return null;

  return (
    <div className={styles.container}>
      <BackButton />
      <div className={styles.contentWrapper}>
        <div className={clsx(styles.content, styles.taskInfo)}>
          <ProjectInfo project={project} />
        </div>
        <div className={clsx(styles.content, styles.members)}>
          <ProjectMembers members={members ?? []} />
        </div>
        <TaskList tasks={tasks} />
      </div>
      <FloatingButtonDesktop />
    </div>
  );
}

function TaskList({ tasks }: { tasks: Task[] }) {
  const { showSortOptions } = useGlobalModals();

  if (tasks.length === 0)
    return (
      <div className={clsx(styles.content, styles.taskList)}>
        <h4>{TEXTS.projects.tasks}</h4>
        <div className={styles.emptyState}>
          <p className="body-reg-2">{TEXTS.projects.noTasks}</p>
        </div>
      </div>
    );

  return (
    <div className={clsx(styles.content, styles.taskList)}>
      <div className={styles.titleWrapper}>
        <h4>{TEXTS.projects.tasks}</h4>
        <IconButton icon={ICONS.sort} size="24px" onClick={showSortOptions} />
      </div>

      <div className={clsx(styles.content, styles.tasks)}>
        {tasks.map((task) => (
          <Link key={`${task.id}-${task.title}`} href={ROUTES.projectTask(task.projectId, task.id)}>
            <ProjectTask title={task.title} />
          </Link>
        ))}
      </div>
    </div>
  );
}
