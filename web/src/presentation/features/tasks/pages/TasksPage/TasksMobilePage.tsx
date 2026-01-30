"use client";

import { ContentTopBarMobile } from "@/presentation/shared";
import { PagesMobileTemplate, TopBarMobile } from "@/presentation/shared/components/Layout";
import { TabType } from "@/presentation/shared/components/TabPanel";
import { useTabPanel } from "@/presentation/shared/components/TabPanel/TabPanelContext";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { TaskListMobile } from "../../components";
import { useGetUserTasks } from "../../hooks";

import styles from "./TasksMobilePage.module.css";

export function TasksMobilePage() {
  const { activeTab } = useTabPanel();
  const { showSortOptions, showCreateTask } = useGlobalModals();
  const { data: tasks } = useGetUserTasks();

  if (!tasks) return null;

  const topBar = <TopBarMobile title={TEXTS.drawer.myTasks} onClick={showCreateTask} />;

  // TODO: Implement sorting logic

  return (
    <PagesMobileTemplate topBar={topBar}>
      <div className={styles.container}>
        <ContentTopBarMobile onClick={showSortOptions} />
        {activeTab === TabType.ACTIVE && <TaskListMobile tasks={tasks} />}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </PagesMobileTemplate>
  );
}
