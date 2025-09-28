"use client";

import { IconButton } from "@/presentation/ui/IconButton";
import "./styles.css";

import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { ICONS } from "@/infrastructure/config/icons";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { mockTasks, TaskListMobile } from "@/presentation/widgets/tasks/TaskList";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { tasksTexts } from "@/shared/locales/tasks";

export default function ArchivePage() {
  const { showSortOptions, showCreateTask } = useGlobalModals();
  const tasks = mockTasks;

  // TODO: Implement sorting logic
  const handleSortTasks = async () => {
    const option = await showSortOptions();
    console.log("Selected sort option:", option);
  };

  return (
    <>
      <MainContainer>
        <DashboardHeader />
        <div className="title-container">
          <h1>{tasksTexts.tasks.title}</h1>
          <IconButton icon={ICONS.sort} onClick={handleSortTasks} />
        </div>
        {(!tasks || tasks.length === 0) && (
          <div className="empty-state">
            <h2>{tasksTexts.tasks.noTasks}</h2>
            <p>{tasksTexts.tasks.createFirstTask}</p>
          </div>
        )}
        <TaskListMobile tasks={tasks} />
        <FloatingButton onClick={showCreateTask} variant="withBottomNav" />
      </MainContainer>
    </>
  );
}
