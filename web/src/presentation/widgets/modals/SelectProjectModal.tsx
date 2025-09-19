"use client";

import { useState } from "react";

import { Project } from "@/domain/project/project.entity";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { ProjectsList } from "../tasks/ProjectsList";
import { useGet } from "@/application/projects/hooks/useProject";
import { DialogButtons } from "../common/DialogButtons";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { TEXTS } from "@/shared/locales/texts";

export default function SelectProjectModal(props: BaseModalProps<Project>) {
  const { data: projects = [] } = useGet();
  const { projectId: initialProjectId } = useGlobalModalProps<{ projectId?: number }>() || {};
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId);

  const handleOnSelect = (project: Project) => {
    setSelectedProjectId(project.id);
    console.log("Project selected:", project.name);
  };

  const handleApply = () => {
    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    props.onClose(selectedProject);
  };
  const handleClose = () => props.onClose(undefined);

  return (
    <BaseModal {...props} fullScreen title={TEXTS.tasks.project}>
      <ProjectsList
        projects={projects}
        onSelect={handleOnSelect}
        selectedProjectId={selectedProjectId}
      />
      <DialogButtons onClose={handleClose} onApply={handleApply} />
    </BaseModal>
  );
}
