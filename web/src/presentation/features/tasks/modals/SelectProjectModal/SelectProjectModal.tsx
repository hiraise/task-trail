import { useState } from "react";

import type { Project } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps, useProjects } from "@/presentation/shared/hooks";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectsList } from "../../components/ProjectsList";

/** Проект задачи — из проектов пользователя; выбран другой — задача переносится туда. */
export function SelectProjectModal(props: BaseModalProps<Project>) {
  const { onClose, ...rest } = props;
  const { data: projects } = useProjects();
  const { projectId: initialProjectId } = useGlobalModalProps<{ projectId?: ProjectId }>() || {};
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);

  const handleApply = () => onClose(projects?.find((p) => p.id === selectedProjectId));

  return (
    <BaseModal {...rest} onClose={() => onClose()} fullScreen title={TEXTS.tasks.project}>
      {projects && projects.length === 0 ? (
        <p className="body-reg-2">{tasksTexts.noProjects}</p>
      ) : (
        <ProjectsList
          projects={projects ?? []}
          onSelect={(project) => setSelectedProjectId(project.id)}
          selectedProjectId={selectedProjectId}
        />
      )}
      <DialogButtons onClose={() => onClose()} onApply={handleApply} />
    </BaseModal>
  );
}
