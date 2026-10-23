import clsx from "clsx";
import { useState } from "react";

import { type LabelColor, type Label, MAX_TASK_LABELS } from "@/domain/models/Label";
import type { LabelId, ProjectId } from "@/domain/types";
import { CheckBox, ColorSwatches, FormFieldError, Icon, LabelChip, SearchField, SubmitButton } from "@/presentation/shared";
import { labelNameField } from "@/presentation/shared/forms/fields";
import { ICONS } from "@/shared/config/icons";
import { errorMessage } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { tasksTexts } from "@/shared/locales/tasks";
import { interpolate } from "@/shared/utils/interpolate";

import { useCreateLabel, useProjectLabels } from "../../hooks";

import styles from "./LabelOptions.module.css";

interface LabelOptionsProps {
  projectId: ProjectId;
  selectedIds: LabelId[];
  onChange: (ids: LabelId[]) => void;
}

/**
 * The labels of a task (artboard C of stage 3): search, checkbox rows and creating a label from the
 * query when no label has exactly that name. At most MAX_TASK_LABELS are selected (ADR-0035).
 */
export function LabelOptions({ projectId, selectedIds, onChange }: LabelOptionsProps) {
  const { data: labels = [], isLoading } = useProjectLabels(projectId);
  const [query, setQuery] = useState("");

  const name = query.trim();
  const needle = name.toLowerCase();
  const found = needle ? labels.filter((label) => label.name.toLowerCase().includes(needle)) : labels;
  const canCreate = name !== "" && !labels.some((label) => label.name.toLowerCase() === needle);
  const limitReached = selectedIds.length >= MAX_TASK_LABELS;

  const toggle = (label: Label) => {
    if (selectedIds.includes(label.id)) onChange(selectedIds.filter((id) => id !== label.id));
    else if (!limitReached) onChange([...selectedIds, label.id]);
  };

  return (
    <div className={styles.container}>
      <SearchField
        type="text"
        placeholder={tasksTexts.searchLabels}
        aria-label={tasksTexts.searchLabels}
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={styles.list}>
        {!isLoading && labels.length === 0 && !name && (
          <p className={clsx("body-reg-2", styles.empty)}>{tasksTexts.noLabels}</p>
        )}
        {found.map((label) => {
          const selected = selectedIds.includes(label.id);
          const disabled = !selected && limitReached;

          return (
            // The whole row toggles the choice; the checkbox is the keyboard control
            <div
              key={label.id}
              className={clsx(styles.row, disabled && styles.disabled)}
              onClick={() => toggle(label)}
            >
              {/* A click on the checkbox must not reach the row and toggle twice */}
              <span className={styles.check} onClick={(event) => event.stopPropagation()}>
                <CheckBox
                  checked={selected}
                  disabled={disabled}
                  aria-label={label.name}
                  onChange={() => toggle(label)}
                />
              </span>
              <span className={styles.chip}>
                <LabelChip label={label} />
              </span>
            </div>
          );
        })}
        {canCreate && (
          <CreateLabel
            projectId={projectId}
            name={name}
            onCreated={(label) => {
              if (!limitReached) onChange([...selectedIds, label.id]);
              setQuery("");
            }}
          />
        )}
      </div>
      {limitReached && <p className={clsx("caption-reg", styles.limit)}>{tasksTexts.labelsLimit}</p>}
    </div>
  );
}

interface CreateLabelProps {
  projectId: ProjectId;
  /** The trimmed search query */
  name: string;
  onCreated: (label: Label) => void;
}

/** The "create a label" row: opens the color choice with a preview; a taken name shows under the row. */
function CreateLabel({ projectId, name, onCreated }: CreateLabelProps) {
  const { mutate: createLabel, isPending } = useCreateLabel();
  const [isOpen, setOpen] = useState(false);
  const [color, setColor] = useState<LabelColor>("gray");
  // The error belongs to the name it was shown for: editing the query hides it
  const [error, setError] = useState<{ name: string; message?: string }>();

  const create = () => {
    const parsed = labelNameField.safeParse(name);

    if (!parsed.success) {
      setError({ name, message: parsed.error.issues[0]?.message });

      return;
    }
    createLabel(
      { projectId, data: { name: parsed.data, color } },
      {
        onSuccess: onCreated,
        onError: (createError) => {
          if (hasErrorCode(createError, "LABEL_NAME_TAKEN")) {
            setError({ name, message: errorMessage(createError, tasksTexts.createLabelFailed) });
          }
        },
      },
    );
  };

  return (
    <div className={styles.create}>
      <button
        type="button"
        className={clsx("body-med-2", styles.createRow)}
        aria-expanded={isOpen}
        onClick={() => setOpen((open) => !open)}
      >
        <Icon as={ICONS.plus} size="20px" inheritColor aria-hidden />
        {interpolate(tasksTexts.createLabel, { name })}
      </button>
      {isOpen && (
        <>
          <span className={clsx("caption-reg", styles.caption)}>{tasksTexts.labelColor}</span>
          <ColorSwatches value={color} onChange={setColor} />
          <div className={styles.createFooter}>
            <LabelChip label={{ id: "", projectId, name, color }} />
            <SubmitButton
              type="button"
              className={clsx("btn-font-s", styles.createButton)}
              disabled={isPending}
              onClick={create}
            >
              {tasksTexts.createLabelButton}
            </SubmitButton>
          </div>
        </>
      )}
      {error?.name === name && <FormFieldError>{error.message}</FormFieldError>}
    </div>
  );
}
