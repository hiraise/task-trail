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
import { useGetCurrentUser, useProjects } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ASSETS } from "@/shared/config/assets";
import { TEXTS } from "@/shared/locales/texts";

import { TaskList } from "../../components";
import { useMyTasks, useOpenCreateTask } from "../../hooks";

import styles from "./TasksPage.module.css";

/** "My tasks" — tasks assigned to the current user across all their projects. */
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
  const { showSortOptions } = useGlobalModals();
  const openCreateTask = useOpenCreateTask();
  const { data: tasks } = useMyTasks();
  const { data: projects } = useProjects();
  const { data: currentUser } = useGetCurrentUser();

  const projectNames = useMemo(
    () => new Map(projects?.map((project) => [project.id, project.name])),
    [projects],
  );

  const renderActive = () => {
    if (!tasks) return null;
    if (tasks.length === 0) {
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

    return <TaskList tasks={tasks} projectNames={projectNames} assignee={currentUser} />;
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
          <ContentTopBarMobile onClick={showSortOptions} />
        </div>
        <div className={styles.wideOnly}>
          <ContentTopBarDesktop onClick={showSortOptions} />
        </div>
        {activeTab === TabType.ACTIVE && renderActive()}
        {/* The server has no archive yet — stage 2 (docs/roadmap.md) */}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </div>
  );
}
