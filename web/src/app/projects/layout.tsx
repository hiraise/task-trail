"use client";

import { useGet } from "@/application/projects/hooks/useProject";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spinner } from "@/presentation/ui/Spinner";
import { projectsTexts } from "@/shared/locales/projects";

function LayoutTemplate({ children }: { children: React.ReactNode }) {
  return (
    <MainContainer>
      <DashboardHeader />
      <div className="content">{children}</div>
    </MainContainer>
  );
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const { data: projects, isLoading } = useGet();

  if (isLoading)
    return (
      <LayoutTemplate>
        <Spinner />
      </LayoutTemplate>
    );

  if (!projects || projects.length === 0)
    return (
      <LayoutTemplate>
        <div className="empty-state">
          <h2>{projectsTexts.projects.noProjects}</h2>
          <p>{projectsTexts.projects.createFirstProject}</p>
        </div>
      </LayoutTemplate>
    );

  return <>{children}</>;
}
