"use client";

import styles from "./TasksMobilePage.module.css";

import { useGetUserTasks } from "@/application/user/hooks/useGetUserTasks";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { TaskList } from "@/presentation/widgets/tasks/TaskList";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { tasksTexts } from "@/shared/locales/tasks";

export function TasksMobilePage() {
  const { showSortOptions, showCreateTask } = useGlobalModals();
  const { data: tasks } = useGetUserTasks();

  if (!tasks) return null;

  // TODO: Implement sorting logic
  const handleSortTasks = async () => {
    const option = await showSortOptions();
    console.log("Selected sort option:", option);
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <div className={styles.titleContainer}>
        <h1>{tasksTexts.tasks.title}</h1>
        <IconButton icon={ICONS.sort} onClick={handleSortTasks} />
      </div>
      {(!tasks || tasks.length === 0) && (
        <div className={styles.emptyState}>
          <h2>{tasksTexts.tasks.noTasks}</h2>
          <p>{tasksTexts.tasks.createFirstTask}</p>
        </div>
      )}
      <TaskList tasks={tasks} />
      <FloatingButton onClick={showCreateTask} variant="withBottomNav" />
    </MainContainer>
  );
}
