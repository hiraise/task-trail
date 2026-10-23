import clsx from "clsx";
import { useState } from "react";

import type { Label } from "@/domain/models/Label";
import { isProjectArchived } from "@/domain/models/Project";
import type { LabelData } from "@/domain/repositories/LabelRepository";
import type { LabelId, ProjectId } from "@/domain/types";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DropdownMenu, Icon, IconButton, LabelChip, SubmitButton } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks";
import { useGlobalModals, type ProjectLabelsProps } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { labelsTexts } from "@/shared/locales/labels";
import { tasksTexts } from "@/shared/locales/tasks";
import { interpolate } from "@/shared/utils/interpolate";
import { canManageLabels } from "@/shared/utils/userRole";

import { useProject } from "../../../projects/hooks";
import { LabelForm } from "../../components";
import { useCreateLabel, useDeleteLabel, useProjectLabels, useUpdateLabel } from "../../hooks";

import styles from "./ProjectLabelsModal.module.css";

/** The labels of a project (artboard E of stage 3): every member sees them, managers change them. */
export function ProjectLabelsModal(props: BaseModalProps<void>) {
  const modalProps = useGlobalModalProps<ProjectLabelsProps>();

  if (!modalProps) return null;

  return <ProjectLabels {...props} {...modalProps} />;
}

/** What the form edits: a label or a new one; `null` — no form is open */
type Editing = LabelId | "new" | null;

function ProjectLabels({ projectId, ...props }: BaseModalProps<void> & ProjectLabelsProps) {
  const { isLoaded, canManage } = useLabelsAccess(projectId);
  const { data: labels = [], isLoading } = useProjectLabels(projectId);
  const { mutateAsync: createLabel } = useCreateLabel();
  const { mutateAsync: updateLabel } = useUpdateLabel();
  const { mutate: deleteLabel } = useDeleteLabel();
  const { showConfirm } = useGlobalModals();
  const [editing, setEditing] = useState<Editing>(null);

  const hint = labelsHint({ isLoaded: isLoaded && !isLoading, count: labels.length, canManage, editing });

  const save = async (label: Label, data: LabelData) => {
    const changes = changedFields(label, data);

    if (Object.keys(changes).length > 0) await updateLabel({ projectId, labelId: label.id, changes });
    setEditing(null);
  };

  const create = async (data: LabelData) => {
    await createLabel({ projectId, data });
    setEditing(null);
  };

  // The confirmation replaces this modal on the global stack: this component unmounts until it closes,
  // so nothing here may wait for it but the deletion itself
  const remove = async (label: Label) => {
    const confirmed = await showConfirm({
      title: interpolate(labelsTexts.deleteLabelTitle, { name: label.name }),
      description: labelsTexts.deleteLabelDescription,
      confirmText: labelsTexts.deleteLabelConfirm,
    });

    if (confirmed) deleteLabel({ projectId, labelId: label.id });
  };

  return (
    <BaseModal {...props} title={labelsTexts.projectLabels}>
      <div className={styles.content}>
        {labels.length > 0 && (
          <ul className={styles.list}>
            {labels.map((label) =>
              editing === label.id ? (
                <li key={label.id}>
                  <LabelForm
                    initial={{ name: label.name, color: label.color }}
                    onSubmit={(data) => save(label, data)}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <LabelRow
                  key={label.id}
                  label={label}
                  canManage={canManage}
                  onEdit={() => setEditing(label.id)}
                  onDelete={() => void remove(label)}
                />
              ),
            )}
          </ul>
        )}
        {hint && <p className={clsx("body-reg-2", styles.hint)}>{hint}</p>}
        {canManage && (
          <NewLabel
            isOpen={editing === "new"}
            onOpen={() => setEditing("new")}
            onCreate={create}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>
    </BaseModal>
  );
}

/** The current user's role in the project; an archived project is read-only for everyone (ADR-0027) */
function useLabelsAccess(projectId: ProjectId) {
  const { data: project } = useProject(projectId);

  return {
    isLoaded: Boolean(project),
    canManage: Boolean(project && !isProjectArchived(project) && canManageLabels(project.role)),
  };
}

interface HintState {
  /** The project and its labels are loaded */
  isLoaded: boolean;
  count: number;
  canManage: boolean;
  editing: Editing;
}

/** Under the list: «no labels yet» (not over the new label form), or why a member cannot change them */
function labelsHint({ isLoaded, count, canManage, editing }: HintState): string | undefined {
  if (!isLoaded) return undefined;
  if (count === 0) return editing === "new" ? undefined : tasksTexts.noLabels;

  return canManage ? undefined : labelsTexts.labelsReadOnly;
}

/** Only what the form changed: the PATCH sends the changed fields */
function changedFields(label: Label, data: LabelData): Partial<LabelData> {
  const changes: Partial<LabelData> = {};

  if (data.name !== label.name) changes.name = data.name;
  if (data.color !== label.color) changes.color = data.color;

  return changes;
}

interface NewLabelProps {
  isOpen: boolean;
  onOpen: () => void;
  onCreate: (data: LabelData) => Promise<void>;
  onCancel: () => void;
}

/** "New label" under the list: the button, or the empty form in its place */
function NewLabel({ isOpen, onOpen, onCreate, onCancel }: NewLabelProps) {
  if (isOpen) return <LabelForm onSubmit={onCreate} onCancel={onCancel} />;

  return (
    <SubmitButton
      type="button"
      variant="text"
      className={clsx("btn-font-s", styles.newLabel)}
      onClick={onOpen}
    >
      <Icon as={ICONS.plus} size="24px" inheritColor aria-hidden />
      {labelsTexts.newLabel}
    </SubmitButton>
  );
}

interface LabelRowProps {
  label: Label;
  /** The owner or an admin of an active project: the row has «…» with the actions */
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function LabelRow({ label, canManage, onEdit, onDelete }: LabelRowProps) {
  return (
    <li className={styles.row}>
      <LabelChip label={label} />
      {canManage && (
        <DropdownMenu
          trigger={
            <IconButton
              icon={ICONS.menuHorizontal}
              size="24px"
              aria-label={interpolate(labelsTexts.labelActions, { name: label.name })}
            />
          }
          items={[
            {
              label: labelsTexts.editLabel,
              icon: ICONS.edit,
              color: "var(--icon-tertiary)",
              onClick: onEdit,
              isVisible: true,
            },
            {
              label: labelsTexts.deleteLabel,
              icon: ICONS.delete,
              color: "var(--icon-critical)",
              onClick: onDelete,
              isVisible: true,
            },
          ]}
        />
      )}
    </li>
  );
}
