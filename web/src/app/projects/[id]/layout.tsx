"use client";

import { useParams } from "next/navigation";

import { useGetById } from "@/application/projects/hooks/useProject";
import { Spinner } from "@/presentation/ui/Spinner";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";

function LayoutTemplate({ children }: { children: React.ReactNode }) {
  return (
    <MainContainer>
      <DashboardHeader />
      <div className="content">{children}</div>
    </MainContainer>
  );
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = Number(params.id);

  const { data: project, isLoading } = useGetById(projectId);

  if (isLoading)
    return (
      <LayoutTemplate>
        <Spinner />;
      </LayoutTemplate>
    );

  if (!project)
    return (
      <LayoutTemplate>
        <h1>Такого проекта не существует</h1>
      </LayoutTemplate>
    );

  return <>{children}</>;
}
