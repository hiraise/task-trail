import clsx from "clsx";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectMenuButton } from "../ProjectMenuButton";

import { ProjectTaskTabs } from "./ProjectTaskTabs";
import styles from "./ProjectTasks.module.css";

interface ProjectTasksProps {
  projectId: ProjectId;
  members: ProjectMember[];
  projectArchived: boolean;
  className?: string;
}

/**
 * Tasks on the project page with tabs and sorting. On a phone an arrow next to the title leads to
 * the project tasks page.
 */
export function ProjectTasks({ projectId, members, projectArchived, className }: ProjectTasksProps) {
  return (
    <section className={clsx(styles.container, className)} aria-label={TEXTS.projects.tasks}>
      <div className={styles.phoneOnly}>
        <ProjectMenuButton
          to="/projects/$id/tasks"
          params={{ id: projectId }}
          text={TEXTS.projects.tasks}
        />
      </div>
      <h4 className={styles.wideOnly}>{TEXTS.projects.tasks}</h4>
      <ProjectTaskTabs projectId={projectId} members={members} projectArchived={projectArchived} />
    </section>
  );
}
