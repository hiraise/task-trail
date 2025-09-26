"use client";

import styles from "./TasksDesktopPage.module.css";

import { useTabPanel } from "@/presentation/widgets/tasks/TabPanel/TabPanelContext";
import { TaskListDesktop } from "@/presentation/widgets/tasks/TaskList/TaskListDesktop";
import { useGetTaskListData } from "@/application/tasks/hooks/useGetTaskListData";
import { TasksDesktopTemplate } from "@/presentation/templates";
import { TopBarDesktop } from "@/presentation/widgets/common/TopBar";
import { TEXTS } from "@/shared/locales/texts";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { ContentTopBarDesktop } from "@/presentation/widgets/common/ContentTopBar";
import { TabType } from "@/presentation/widgets/tasks/TabPanel";

export function TasksDesktopPage() {
  const { activeTab } = useTabPanel();
  const { tasks } = useGetTaskListData();
  const { showCreateTask, showSortOptions } = useGlobalModals();

  if (!tasks) return null;

  const topBar = (
    <TopBarDesktop
      title={TEXTS.drawer.myTasks}
      buttonText={TEXTS.tasks.createButton}
      onClick={showCreateTask}
    />
  );

  //TODO: implement archived tasks UI

  return (
    <TasksDesktopTemplate topBar={topBar}>
      <div className={styles.container}>
        <ContentTopBarDesktop onClick={showSortOptions} />
        {activeTab === TabType.ACTIVE && <TaskListDesktop tasks={tasks} />}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </TasksDesktopTemplate>
  );
}
