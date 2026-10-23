import { useMemo } from "react";

import {
  ContentTopBarDesktop,
  ContentTopBarMobile,
  EmptyListState,
  TabPanelProvider,
  TabType,
  useTabPanel,
} from "@/presentation/shared";
import { TopBarDesktop, TopBarMobile } from "@/presentation/shared/components/Layout";
import { useGetCurrentUser, useListSort, useProjects } from "@/presentation/shared/hooks";
import { ASSETS } from "@/shared/config/assets";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";
import { sortItems } from "@/shared/utils/sortItems";

import { TaskList } from "../../components";
import { useMyTasks, useOpenCreateTask } from "../../hooks";

import styles from "./TasksPage.module.css";

/**
 * "My tasks" — tasks assigned to the current user across all their projects. Archived — tasks
 * archived on their own or with their project (ADR-0027).
 */
export function TasksPage() {
  return (
    <TabPanelProvider>
      <TasksScreen />
    </TabPanelProvider>
  );
}

// On a phone — the top bar and phone tabs; from 768 px — a header with a button and a card
// (ADR-0008): both are in the markup, one is visible depending on the screen width.
function TasksScreen() {
  const { activeTab } = useTabPanel();
  const archived = activeTab === TabType.ARCHIVED;
  const { sort, openSort } = useListSort("my-tasks", { tasks: true });
  const openCreateTask = useOpenCreateTask();
  const { data: tasks } = useMyTasks(archived);
  const { data: projects } = useProjects();
  // An archived task may belong to an archived project: its name is in the other list
  const { data: archivedProjects } = useProjects(true, { enabled: archived });
  const { data: currentUser } = useGetCurrentUser();

  const projectNames = useMemo(
    () =>
      new Map(
        [...(projects ?? []), ...(archivedProjects ?? [])].map((project) => [
          project.id,
          project.name,
        ]),
      ),
    [projects, archivedProjects],
  );
  const sorted = useMemo(() => tasks && sortItems(tasks, sort), [tasks, sort]);

  const renderList = () => {
    if (!sorted) return null;
    if (sorted.length === 0 && archived) {
      return (
        <EmptyListState
          src={ASSETS.images.task}
          alt={TEXTS.tasks.taskAlt}
          text={tasksTexts.emptyArchive}
        />
      );
    }
    if (sorted.length === 0) {
      return (
        <EmptyListState
          src={ASSETS.images.task}
          alt={TEXTS.tasks.taskAlt}
          text={TEXTS.tasks.empty}
          btnLabel={TEXTS.tasks.createButton}
          onClick={() => openCreateTask()}
        />
      );
    }

    return <TaskList tasks={sorted} projectNames={projectNames} assignee={currentUser} />;
  };

  return (
    <div className={styles.page}>
      <div className={styles.phoneTopBar}>
        <TopBarMobile title={TEXTS.drawer.myTasks} onClick={() => openCreateTask()} />
      </div>
      <div className={styles.wideTopBar}>
        <TopBarDesktop
          title={TEXTS.drawer.myTasks}
          buttonText={TEXTS.tasks.createButton}
          onClick={() => openCreateTask()}
        />
      </div>
      <div className={styles.content}>
        <div className={styles.phoneOnly}>
          <ContentTopBarMobile onClick={openSort} />
        </div>
        <div className={styles.wideOnly}>
          <ContentTopBarDesktop onClick={openSort} />
        </div>
        {renderList()}
      </div>
    </div>
  );
}
