"use client";

import { useState } from "react";

import type { Project } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps, useProjects } from "@/presentation/shared/hooks";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectsList } from "../../components/ProjectsList";

export default function SelectProjectModal(props: BaseModalProps<Project>) {
  // const { data: projects = [] } = useGet();
  const { data: projects = [] } = useProjects();
  const { projectId: initialProjectId } = useGlobalModalProps<{ projectId?: ProjectId }>() || {};
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId | undefined>(
    initialProjectId,
  );

  const handleOnSelect = (project: Project) => {
    setSelectedProjectId(project.id);
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
