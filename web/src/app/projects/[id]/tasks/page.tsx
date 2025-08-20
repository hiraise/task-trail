"use client";

import { useEffect } from "react";

import "./styles.css";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BackButton } from "@/presentation/ui/BackButton";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { TaskList } from "@/presentation/widgets/projects/TaskList";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useProjects } from "@/application/projects/hooks/useProjects";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { selectProjectTasks } from "@/application/projects/slices/projectSelectors";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";

const texts = {
  title: "Задачи проекта",
};

export default function ProjectTasksPage() {
  const { projectId, tasks } = useAppSelector(selectProjectTasks);
  const { showSortOptions, showCreateTask } = useGlobalModals();

  const { isLoading, getTasks } = useProjects();

  useEffect(() => {
    async function fetchMembers() {
      if (!projectId) return;
      await getTasks(projectId);
    }
    fetchMembers();
  }, [getTasks, projectId]);

  // TODO: Implement sorting logic
  const handleSortTasks = async () => {
    const option = await showSortOptions();
    console.log("Selected sort option:", option);
  };

  // TODO: Implement task creation logic
  const handleCreateTask = async () => {
    const data = await showCreateTask();
    console.log("Created task data:", data);
  };

  if (isLoading) return <LoadingScreen />;

  if (tasks.length === 0)
    return (
      <MainContainer>
        <DashboardHeader />
        <div className="container">
          <BackButton />
        </div>
        <div className="content">
          <h1>Опаньки... Похоже, у вас нет задач. Chill</h1>
        </div>
      </MainContainer>
    );

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="container">
        <BackButton />
      </div>
      <div className="content">
        <div className="title-wrapper">
          <div className="tasks-title">
            <h1>{texts.title}</h1>
            <IconButton icon={ICONS.sort} size="24px" onClick={handleSortTasks} />
          </div>
        </div>
        <div className="task-list">
          <TaskList availableTasks={tasks} />
        </div>
      </div>
      <FloatingButton onClick={handleCreateTask} />
    </MainContainer>
  );
}
