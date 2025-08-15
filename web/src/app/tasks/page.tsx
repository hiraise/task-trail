"use client";

import { IconButton } from "@/presentation/ui/IconButton";
import "./styles.css";

import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { useModalSheet } from "@/application/projects/hooks/useModalSheet";
import { ICONS } from "@/infrastructure/config/icons";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { mockTasks, TaskList } from "@/presentation/widgets/tasks/TaskList";

export const tasksTexts = {
  title: "Задачи",
  noTasks: "Нет задач",
  createFirstTask: "Создайте свою первую задачу!",
};

export default function TasksPage() {
  // Context is for projects
  const { showCreateTask, showSortOptions } = useModalSheet();
  const tasks = mockTasks;

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="title-container">
        <h1>{tasksTexts.title}</h1>
        <IconButton icon={ICONS.sort} onClick={showSortOptions} />
      </div>
      {(!tasks || tasks.length === 0) && (
        <div className="empty-state">
          <h2>{tasksTexts.noTasks}</h2>
          <p>{tasksTexts.createFirstTask}</p>
        </div>
      )}
      <TaskList tasks={tasks} />
      <FloatingButton onClick={showCreateTask} variant="withBottomNav" />
      <BottomNavBar />
    </MainContainer>
  );
}
