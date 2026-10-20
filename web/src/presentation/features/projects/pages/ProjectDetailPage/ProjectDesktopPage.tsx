import clsx from "clsx";
import { Link, useParams } from "@tanstack/react-router";

import type { Task } from "@/domain/models/Task";
import type { ProjectId } from "@/domain/types";
import { BackButton, IconButton } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import {
  FloatingButtonDesktop,
  ProjectInfoDesktop,
  ProjectMembers,
  ProjectTask,
} from "../../components";
import { useProjectDetail } from "../../hooks";

import styles from "./ProjectDesktopPage.module.css";

export function ProjectDesktopPage() {
  const { id } = useParams({ from: "/_main/projects/$id/" });
  const projectId = id as ProjectId;
  const { data } = useProjectDetail(projectId);

  if (!data) return null;

  return (
    <div className={styles.container}>
      <BackButton />
      <div className={styles.contentWrapper}>
        <div className={clsx(styles.content, styles.taskInfo)}>
          <ProjectInfoDesktop project={data.project} />
        </div>
        <div className={clsx(styles.content, styles.members)}>
          <ProjectMembers members={data.members ?? []} />
        </div>
        <TaskList tasks={data.tasks} />
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
          <Link
            key={`${task.id}-${task.name}`}
            to="/projects/$id/tasks/$taskId"
            params={{ id: task.projectId, taskId: task.id }}
          >
            <ProjectTask title={task.name} />
          </Link>
        ))}
      </div>
    </div>
  );
}
