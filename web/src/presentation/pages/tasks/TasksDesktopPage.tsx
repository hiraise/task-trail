"use client";

import styles from "./TasksDesktopPage.module.css";

import { TaskListTopBarDesktop } from "@/presentation/widgets/tasks/TaskList";
import { useTabPanel } from "@/presentation/widgets/tasks/TabPanel/TabPanelContext";
import { TabType } from "@/presentation/widgets/tasks/TabPanel/TabPanel";
import { TaskListDesktop } from "@/presentation/widgets/tasks/TaskList/TaskListDesktop";
import { useGetTaskListData } from "@/application/tasks/hooks/useGetTaskListData";
import { TasksDesktopTemplate } from "@/presentation/templates";
import { TopBar } from "@/presentation/widgets/common/TopBar";
import { TEXTS } from "@/shared/locales/texts";

export function TasksDesktopPage() {
  const { activeTab } = useTabPanel();
  const { tasks } = useGetTaskListData();

  if (!tasks) return null;

  const handleCreateTask = () => {
    console.log("Create task");
  };

  const topBar = (
    <TopBar
      title={TEXTS.drawer.myTasks}
      buttonText={TEXTS.tasks.createButton}
      onClick={handleCreateTask}
    />
  );

  //TODO: implement archived tasks UI

  return (
    <TasksDesktopTemplate topBar={topBar}>
      <div className={styles.container}>
        <TaskListTopBarDesktop />
        {activeTab === TabType.ACTIVE && <TaskListDesktop tasks={tasks} />}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </TasksDesktopTemplate>
  );
}
