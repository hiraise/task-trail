"use client";

import { useEffect } from "react";

import { useProject } from "@/application/projects/hooks/useProject";
import { useProjects } from "@/application/projects/hooks/useProjects";
import { Spinner } from "@/presentation/ui/Spinner";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { getById, getMembers, clearCurrent } = useProjects();
  const { isLoading, projectId } = useProject();

  useEffect(() => {
    async function fetchProject() {
      await getById(projectId);
      await getMembers(projectId);
    }
    fetchProject();
    return () => clearCurrent();
  }, [projectId, getById, clearCurrent, getMembers]);

  if (isLoading) return <Spinner />;
  return <>{children}</>;
}
