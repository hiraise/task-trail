"use client";

import { useParams } from "next/navigation";

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

const projectTexts = {
  owner: "Салунин Максим",
  date: "10.04.2025",
  membersTitle: "Участники проекта",
  tasksTitle: "Задачи проекта",
};

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const { menuItems } = useProjectMenuItems(Number(id));
  const { showCreateTask } = useModalSheet();

  const project = useAppSelector((state) => state.project.project);

  if (!project) return <h1>Такого проекта не существует</h1>;

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
            ></DropdownMenu>
          </div>
          <p className="description">{project.description}</p>
          <p className="owner">
            {projectTexts.owner} | {projectTexts.date}
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
            {mockTasks.slice(0, 4).map((task) => (
              <ProjectTask key={task.id} title={task.title} />
            ))}
          </div>
        </div>
      </div>
      <FloatingButton onClick={showCreateTask} />
    </MainContainer>
  );
}
