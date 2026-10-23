import { useMemo } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import {
  ContentTopBarDesktop,
  ContentTopBarMobile,
  TabPanelProvider,
  TabType,
  useTabPanel,
} from "@/presentation/shared";
import { useListSort, useProjectTasks } from "@/presentation/shared/hooks";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";
import { sortItems } from "@/shared/utils/sortItems";

import styles from "./ProjectTasks.module.css";
import { TaskList } from "./TaskList";

interface ProjectTaskTabsProps {
  projectId: ProjectId;
  members: ProjectMember[];
  /** The project is archived: both tabs are read-only, nothing to create (ADR-0027) */
  projectArchived: boolean;
}

/**
 * Project tasks with the Active / Archived tabs tabs by the task's own archive flag (ADR-0027) and sorting.
 * Figma has no tabs here — they are made like in "My tasks" (stage 2 plan, step 2).
 */
export function ProjectTaskTabs(props: ProjectTaskTabsProps) {
  return (
    <TabPanelProvider>
      <ProjectTaskList {...props} />
    </TabPanelProvider>
  );
}

function ProjectTaskList({ projectId, members, projectArchived }: ProjectTaskTabsProps) {
  const { activeTab } = useTabPanel();
  const archived = activeTab === TabType.ARCHIVED;
  const { sort, openSort } = useListSort("project-tasks");
  const { data: tasks } = useProjectTasks(projectId, archived);

  const sorted = useMemo(() => tasks && sortItems(tasks, sort), [tasks, sort]);

  const emptyText = () => {
    if (archived) return tasksTexts.emptyArchive;

    return projectArchived ? tasksTexts.noActiveTasks : TEXTS.projects.noTasks;
  };

  return (
    <>
      <div className={styles.phoneOnly}>
        <ContentTopBarMobile onClick={openSort} />
      </div>
      <div className={styles.wideOnly}>
        <ContentTopBarDesktop onClick={openSort} />
      </div>
      {sorted &&
        (sorted.length > 0 ? (
          <TaskList tasks={sorted} members={members} />
        ) : (
          <div className={styles.empty} role="status">
            <p className="caption-reg">{emptyText()}</p>
          </div>
        ))}
    </>
  );
}
