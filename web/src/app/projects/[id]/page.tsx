"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";

import "./styles.css";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BackButton } from "@/presentation/ui/BackButton";
import { UserAvatar } from "@/presentation/widgets/projects/UserAvatar/UserAvatar";
import { ProjectTask } from "@/presentation/widgets/projects/ProjectTask";
import { ProjectMenuButton } from "@/presentation/widgets/projects/ProjectMenuButton";
import { ROUTES } from "@/infrastructure/config/routes";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { DropdownMenu } from "@/presentation/widgets/projects/DropdownMenu";
import { useProjectMenuItems } from "@/application/projects/hooks/useProjectMenuItems";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { useModalSheet } from "@/application/projects/hooks/useModalSheet";
import { mockTasks } from "@/presentation/widgets/projects/TaskList";
import { Spinner } from "@/presentation/ui/Spinner";

const projectTexts = {
  membersTitle: "Участники проекта",
  tasksTitle: "Задачи проекта",
};

export default function ProjectPage() {
  const id = useParams().id as string;
  const projectId = Number(id);

  const { project, owner, isLoading } = useAppSelector((state) => ({
    project: state.project.project,
    owner: state.project.members.find((m) => m.isOwner)?.username || "Unknown",
    isLoading: state.project.isLoading,
  }));

  const { menuItems } = useProjectMenuItems(projectId);
  const { showCreateTask } = useModalSheet();

  // Mock tasks for display
  const displayTasks = useMemo(() => mockTasks.slice(0, 4), []);

  if (isLoading) {
    return (
      <MainContainer>
        <DashboardHeader />
        <div className="container">
          <BackButton />
        </div>
        <div className="content">
          <Spinner />
        </div>
      </MainContainer>
    );
  }

  if (!project) {
    return (
      <MainContainer>
        <DashboardHeader />
        <div className="container">
          <BackButton />
        </div>
        <div className="content">
          <h1>Такого проекта не существует</h1>
        </div>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="container">
        <BackButton />
      </div>
      <div className="content">
        <div className="title-wrapper">
          <div className="project-title">
            <h1>{project.name}</h1>
            <DropdownMenu
              trigger={<IconButton icon={ICONS.menu} size="24px" />}
              items={menuItems}
            />
          </div>
          <p className="description">{project.description}</p>
          <p className="owner">
            {owner} | {project.createdAt}
          </p>
        </div>
        <div className="members">
          <ProjectMenuButton href={ROUTES.projectMembers(id)} text={projectTexts.membersTitle} />
          <div className="members-list">
            <UserAvatar />
            <UserAvatar />
            <UserAvatar />
            <UserAvatar />
          </div>
        </div>
        <div className="tasks">
          <ProjectMenuButton href={ROUTES.projectTasks(id)} text={projectTexts.tasksTitle} />
          <div className="task-list">
            {displayTasks.map((task) => (
              <ProjectTask key={task.id} title={task.title} />
            ))}
          </div>
        </div>
      </div>
      <FloatingButton onClick={showCreateTask} />
    </MainContainer>
  );
}
