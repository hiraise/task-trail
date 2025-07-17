"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useProjects } from "@/application/projects/hooks/useProjects";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;
  const { getProjectById, clearCurrentProject } = useProjects();

  useEffect(() => {
    async function fetchProject() {
      await getProjectById(id);
    }
    fetchProject();
    return () => clearCurrentProject();
  }, [id, getProjectById, clearCurrentProject]);

  return <>{children}</>;
}
