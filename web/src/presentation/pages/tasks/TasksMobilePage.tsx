"use client";

import styles from "./TasksMobilePage.module.css";

import { useGetUserTasks } from "@/application/user/hooks/useGetUserTasks";
import { PagesMobileTemplate } from "@/presentation/templates";
import { ContentTopBarMobile } from "@/presentation/widgets/common/ContentTopBar";
import { TopBarMobile } from "@/presentation/widgets/common/TopBar/TopBarMobile";
import { TabType } from "@/presentation/widgets/tasks/TabPanel";
import { useTabPanel } from "@/presentation/widgets/tasks/TabPanel/TabPanelContext";
import { TaskListMobile } from "@/presentation/widgets/tasks/TaskList";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

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
