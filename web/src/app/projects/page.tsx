"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import "./styles.css";
import { ICONS } from "@/infrastructure/config/icons";
import { ROUTES } from "@/infrastructure/config/routes";
import { IconButton } from "@/presentation/ui/IconButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { ProjectCard } from "@/presentation/widgets/projects/ProjectCard";
import { useModalSheet } from "@/application/projects/hooks/useModalSheet";
import { useProjects } from "@/application/projects/hooks/useProjects";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";

const projectTexts = {
  title: "Мои проекты",
  noProjects: "Нет проектов",
  createFirstProject: "Создайте свой первый проект!",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { showCreateProject, showSortOptions } = useModalSheet();
  const { getProjects, isLoading, projects } = useProjects();

  const handleOpenProject = (projectId: string) => {
    router.push(ROUTES.project(projectId));
  };

  useEffect(() => {
    const fetchProjects = async () => {
      await getProjects();
    };
    if (!projects || projects.length === 0) fetchProjects();
  }, [getProjects, projects]);

  if (isLoading) return <LoadingScreen />;

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="title-container">
        <h1>{projectTexts.title}</h1>
        <IconButton icon={ICONS.sort} onClick={showSortOptions} />
      </div>
      {(!projects || projects.length === 0) && (
        <div className="empty-state">
          <h2>{projectTexts.noProjects}</h2>
          <p>{projectTexts.createFirstProject}</p>
        </div>
      )}
      <div className="cards-container">
        {projects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => handleOpenProject(project.id)}
          />
        ))}
      </div>
      <FloatingButton onClick={showCreateProject} variant="withBottomNav" />
      <BottomNavBar />
    </MainContainer>
  );
}
