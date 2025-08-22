"use client";

import { useEffect } from "react";

import { Project } from "@/domain/project/project.entity";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { ProjectsList } from "../tasks/ProjectsList";
import { useProjects } from "@/application/projects/hooks/useProjects";

export default function SelectProjectModal(props: BaseModalProps<Project>) {
  const { projects, get } = useProjects();

  useEffect(() => {
    const fetchProjects = async () => {
      await get();
    };
    if (!projects || projects.length === 0) fetchProjects();
  }, [get, projects]);

  const handleOnSelect = (project: Project) => {
    props.onClose(project);
    console.log("Project selected:", project.name);
  };

  return (
    <BaseModal {...props} fullScreen showBackButton title="Проект">
      <ProjectsList projects={projects} onSelect={handleOnSelect} />
    </BaseModal>
  );
}
