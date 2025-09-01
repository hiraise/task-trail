"use client";

import { Project } from "@/domain/project/project.entity";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { ProjectsList } from "../tasks/ProjectsList";
import { useGet } from "@/application/projects/hooks/useProject";

export default function SelectProjectModal(props: BaseModalProps<Project>) {
  const { data: projects = [] } = useGet();

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
