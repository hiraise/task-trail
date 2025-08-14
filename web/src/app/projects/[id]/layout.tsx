"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";

import { useProjects } from "@/application/projects/hooks/useProjects";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = Number(params.id);
  const { getById, getMembers, clearCurrent } = useProjects();

  useEffect(() => {
    async function fetchProject() {
      await getById(id);
      await getMembers(id);
    }
    fetchProject();
    return () => clearCurrent();
  }, [id, getById, clearCurrent, getMembers]);

  return <>{children}</>;
}
