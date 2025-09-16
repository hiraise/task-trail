"use client";

import styles from "./TasksDesktopPage.module.css";

import { TaskListTopBarDesktop } from "@/presentation/widgets/tasks/TaskList";
import { useTabPanel } from "@/presentation/widgets/tasks/TabPanel/TabPanelContext";
import { TabType } from "@/presentation/widgets/tasks/TabPanel/TabPanel";
import { TaskListDesktop } from "@/presentation/widgets/tasks/TaskList/TaskListDesktop";
import { useGetUserTasks } from "@/application/user/hooks/useGetUserTasks";

export function TasksDesktopPage() {
  const { activeTab } = useTabPanel();
  const { data: tasks } = useGetUserTasks();

  if (!tasks) return null;

  //TODO: implement archived tasks UI

  return (
    <div className={styles.container}>
      <TaskListTopBarDesktop />
      {activeTab === TabType.ACTIVE && <TaskListDesktop tasks={tasks} />}
      {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
    </div>
  );
}
