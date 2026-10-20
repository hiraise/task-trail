"use client";

import { ContentTopBarDesktop } from "@/presentation/shared";
import { TasksDesktopTemplate, TopBarDesktop } from "@/presentation/shared/components/Layout";
import { TabType, useTabPanel } from "@/presentation/shared/components/TabPanel";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { TaskListDesktop } from "../../components";
import { useGetTaskListDetails } from "../../hooks/useGetTaskListDetails";

import styles from "./TasksDesktopPage.module.css";

export function TasksDesktopPage() {
  const { activeTab } = useTabPanel();
  const { data } = useGetTaskListDetails();
  const { showCreateTask, showSortOptions } = useGlobalModals();

  if (!data) return null;

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
        {activeTab === TabType.ACTIVE && <TaskListDesktop data={data} />}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </TasksDesktopTemplate>
  );
}
