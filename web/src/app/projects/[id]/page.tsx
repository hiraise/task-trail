"use client";

import { useEffect } from "react";
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
import { useProjects } from "@/application/projects/hooks/useProjects";
import { useAppSelector } from "@/infrastructure/redux/hooks";

const projectTexts = {
  owner: "Салунин Максим",
  date: "10.04.2025",
  membersTitle: "Участники проекта",
  tasksTitle: "Задачи проекта",
};

const tasks = [
  { id: 1, title: "Подготовить презентацию" },
  {
    id: 2,
    title:
      "Вдохновляющая и длинная задача в две строки длиною: найти новый подход",
  },
  {
    id: 3,
    title:
      "Вдохновляющая и длинная задача в две строки длиною: найти новый подход",
  },
  { id: 4, title: "Обновить дизайн" },
];

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const { menuItems } = useProjectMenuItems(id);

  const { getProjectById, clearCurrentProject } = useProjects();
  const project = useAppSelector((state) => state.project.project);

  useEffect(() => {
    async function fetchProject() {
      await getProjectById(id);
    }
    fetchProject();
    return () => clearCurrentProject();
  }, [id, getProjectById, clearCurrentProject]);

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
          <ProjectMenuButton
            href={ROUTES.projectMembers(id)}
            text={projectTexts.membersTitle}
          />
          <div className="members-list">
            <UserAvatar />
            <UserAvatar />
            <UserAvatar />
            <UserAvatar />
          </div>
        </div>
        <div className="tasks">
          <ProjectMenuButton
            href={ROUTES.projectTasks(id)}
            text={projectTexts.tasksTitle}
          />
          <div className="task-list">
            {tasks.map((task) => (
              <ProjectTask key={task.id} title={task.title} />
            ))}
          </div>
        </div>
      </div>
      <FloatingButton onClick={() => console.log("Add task")} />
    </MainContainer>
  );
}
