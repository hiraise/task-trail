import clsx from "clsx";
import { useState } from "react";

import type { Task } from "@/domain/models/Task";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, SearchField, SubmitButton } from "@/presentation/shared";
import { useDevice } from "@/presentation/shared/hooks";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { SelectParentProps } from "@/presentation/shared/hooks/useGlobalModals";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";

import { useProjectTasks, useTask } from "../../hooks";

import { parentCandidates } from "./parentCandidates";
import styles from "./SelectParentModal.module.css";

/**
 * The parent picker of "Make a subtask" (artboard C of stage 3, ADR-0036): active tasks of the project
 * that may be a parent. A tap on a row chooses it, so on 768+ there is only "Cancel" below (agreed
 * deviation).
 */
export function SelectParentModal(props: BaseModalProps<Task>) {
  const { onClose, ...rest } = props;
  const { projectId, taskId } = useGlobalModalProps<SelectParentProps>() ?? { projectId: "", taskId: "" };
  const { data: tasks } = useProjectTasks(projectId);
  const { data: task } = useTask(taskId);
  const [query, setQuery] = useState("");
  const isPhone = useDevice() === "mobile";
  const candidates = tasks && task ? parentCandidates(tasks, task, query) : undefined;

  return (
    <BaseModal {...rest} onClose={() => onClose()} fullScreen title={tasksTexts.chooseParent}>
      <div className={styles.content}>
        <SearchField
          type="search"
          placeholder={tasksTexts.searchParent}
          aria-label={tasksTexts.searchParent}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className={styles.list}>
          {candidates?.length === 0 && (
            <p className={clsx("caption-reg", styles.empty)}>{tasksTexts.noParentCandidates}</p>
          )}
          {candidates?.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={styles.row}
              onClick={() => onClose(candidate)}
            >
              <span className={clsx("caption-reg", styles.key)}>{candidate.key}</span>
              <span className="body-reg-2">{candidate.name}</span>
            </button>
          ))}
        </div>
        {!isPhone && (
          <div className={styles.buttons}>
            <SubmitButton variant="secondary" onClick={() => onClose()}>
              {TEXTS.cancel}
            </SubmitButton>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
