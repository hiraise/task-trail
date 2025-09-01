"use client";

import Link from "next/link";

import "./styles.css";

import { ICONS } from "@/infrastructure/config/icons";
import { ROUTES } from "@/infrastructure/config/routes";
import { IconButton } from "@/presentation/ui/IconButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { ProjectCard } from "@/presentation/widgets/projects/ProjectCard";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useGet } from "@/application/projects/hooks/useProject";
import { projectsTexts } from "@/shared/locales/projects";

export default function ProjectsPage() {
  const { showCreateProject, showSortOptions } = useGlobalModals();
  const { data: projects } = useGet();

  if (!projects) return null;

  // TODO: Implement sorting logic
  const handleSortProjects = async () => {
    const option = await showSortOptions();
    console.log("Selected sort option:", option);
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="title-container">
        <h1>{projectsTexts.projects.title}</h1>
        <IconButton icon={ICONS.sort} onClick={handleSortProjects} />
      </div>
      <div className="cards-container">
        {projects?.map((project) => (
          <Link key={project.id} href={ROUTES.project(project.id)}>
            <ProjectCard project={project} />
          </Link>
        ))}
      </div>
      <FloatingButton onClick={showCreateProject} variant="withBottomNav" />
      <BottomNavBar />
    </MainContainer>
  );
}
