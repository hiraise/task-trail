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
import { useProjects } from "@/application/projects/hooks/useProjects";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

const projectTexts = {
  title: "Мои проекты",
  noProjects: "Нет проектов",
  createFirstProject: "Создайте свой первый проект!",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { showCreateProject, showSortOptions } = useGlobalModals();
  const { get, isLoading, projects } = useProjects();

  const handleOpenProject = (projectId: number) => {
    router.push(ROUTES.project(projectId.toString()));
  };

  useEffect(() => {
    const fetchProjects = async () => {
      await get();
    };
    if (!projects || projects.length === 0) fetchProjects();
  }, [get, projects]);

  // TODO: Implement sorting logic
  const handleSortProjects = async () => {
    const option = await showSortOptions();
    console.log("Selected sort option:", option);
  };

  // TODO: Implement project creation logic
  const handleCreateProject = async () => {
    const data = await showCreateProject();
    console.log("Created project data:", data);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="title-container">
        <h1>{projectTexts.title}</h1>
        <IconButton icon={ICONS.sort} onClick={handleSortProjects} />
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
      <FloatingButton onClick={handleCreateProject} variant="withBottomNav" />
      <BottomNavBar />
    </MainContainer>
  );
}
