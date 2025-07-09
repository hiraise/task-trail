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
import {
  DropdownMenu,
  menuItems,
} from "@/presentation/widgets/projects/DropdownMenu";

const projectTexts = {
  title: "Разработка мобильного приложения",
  description:
    "Планирование, дизайн и разработка нового приложения для iOS и Android",
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

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="container">
        <BackButton />
      </div>
      <div className="content">
        <div className="title-wrapper">
          <div className="title">
            <h1>{projectTexts.title}</h1>
            <DropdownMenu
              trigger={
                <IconButton
                  icon={ICONS.menu}
                  size="24px"
                  onClick={() => console.log("menu button")}
                />
              }
              items={menuItems}
            ></DropdownMenu>
          </div>
          <p className="description">{projectTexts.description}</p>
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
    </MainContainer>
  );
}
