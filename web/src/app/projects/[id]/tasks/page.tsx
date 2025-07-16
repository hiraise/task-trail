"use client";

import "./styles.css";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BackButton } from "@/presentation/ui/BackButton";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { TaskList } from "@/presentation/widgets/projects/TaskList";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { useModalSheet } from "@/application/projects/hooks/useModalSheet";

const texts = {
  title: "Задачи проекта",
};

export default function ProjectTasksPage() {
  const { showSortTaksOptions } = useModalSheet();

  const handleFloatingButtonClick = () => {
    console.log("Floating button clicked");
  };

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
            <IconButton
              icon={ICONS.sort}
              size="24px"
              onClick={showSortTaksOptions}
            />
          </div>
        </div>
        <div className="task-list">
          <TaskList />
        </div>
      </div>
      <FloatingButton onClick={handleFloatingButtonClick} />
    </MainContainer>
  );
}
