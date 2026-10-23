import { useState } from "react";

import type { ProjectId } from "@/domain/types";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, SubmitButton } from "@/presentation/shared";
import { useGlobalModalProps, useProjects } from "@/presentation/shared/hooks";
import type { SelectBoardProjectsProps } from "@/presentation/shared/hooks/useGlobalModals";
import { boardsTexts } from "@/shared/locales/boards";

import { BoardProjectPicker } from "../components/BoardProjectPicker";

import styles from "./BoardModals.module.css";

/** Board projects: a multiple choice of the user's active projects; returns the chosen IDs. */
export function SelectBoardProjectsModal(props: BaseModalProps<ProjectId[]>) {
  const modalProps = useGlobalModalProps<SelectBoardProjectsProps>();

  if (!modalProps) return null;

  return <SelectProjects {...props} {...modalProps} />;
}

function SelectProjects({
  selectedIds,
  extraProjects,
  applyText,
  onClose,
  ...rest
}: BaseModalProps<ProjectId[]> & SelectBoardProjectsProps) {
  const { data: projects } = useProjects();
  const [selected, setSelected] = useState(selectedIds);

  const toggle = (id: ProjectId) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  return (
    <BaseModal {...rest} onClose={() => onClose()} fullScreen title={boardsTexts.projects}>
      <div className={styles.picker}>
        <BoardProjectPicker
          projects={projects ?? []}
          extraProjects={extraProjects}
          selectedIds={selected}
          onToggle={toggle}
        />
        {/* A board has at least one project (CreateBoardRequest, SetBoardProjectsRequest) */}
        <SubmitButton type="button" disabled={selected.length === 0} onClick={() => onClose(selected)}>
          {applyText}
        </SubmitButton>
      </div>
    </BaseModal>
  );
}
