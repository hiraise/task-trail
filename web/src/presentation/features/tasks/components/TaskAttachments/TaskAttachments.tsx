import clsx from "clsx";
import { useRef, type ChangeEvent } from "react";

import type { Task } from "@/domain/models/Task";
import type { ProjectRole } from "@/domain/types";
import { Icon, SubmitButton } from "@/presentation/shared";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";

import { useTaskAttachments, useUploadAttachments } from "../../hooks";

import { AttachmentItem, PendingItem } from "./AttachmentItem";
import styles from "./TaskAttachments.module.css";

interface TaskAttachmentsProps {
  task: Task;
  /** The current user's role in the task's project: who may delete others' files */
  role: ProjectRole;
  /** An archived task: files are downloaded, nothing is added or deleted (ADR-0027) */
  readOnly: boolean;
  /** The card around the block: the page section or the modal section */
  className?: string;
}

/**
 * The attachments block after the subtasks (artboard B of stage 3, ADR-0037): image previews and file
 * icons, download on a click, a "…" menu. One column; two when the block is 640 px wide or more.
 */
export function TaskAttachments({ task, role, readOnly, className }: TaskAttachmentsProps) {
  const { data: attachments } = useTaskAttachments(task.id);
  const { data: me } = useGetCurrentUser();
  const { upload, pending, isPending } = useUploadAttachments(task.id);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    // Reset so the same file can be chosen again
    event.target.value = "";
    if (files.length > 0) upload(files);
  };

  const empty = attachments?.length === 0 && pending.length === 0;

  return (
    <section className={clsx(styles.block, className)} aria-label={tasksTexts.attachments}>
      <div className={styles.header}>
        <h4 className={styles.title}>{tasksTexts.attachments}</h4>
        {!readOnly && (
          <>
            <SubmitButton
              type="button"
              variant="text"
              className={clsx("btn-font-s", styles.add)}
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Icon as={ICONS.paperclip} size="24px" inheritColor aria-hidden />
              {isPending ? tasksTexts.uploading : tasksTexts.addFile}
            </SubmitButton>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              data-testid="attachment-input"
              onChange={handleChange}
            />
          </>
        )}
      </div>
      {empty && <p className={clsx("body-reg-2", styles.secondary)}>{tasksTexts.noAttachments}</p>}
      {((attachments && attachments.length > 0) || pending.length > 0) && (
        <ul className={styles.list}>
          {pending.map((item) => (
            <li key={item.key}>
              <PendingItem name={item.file.name} />
            </li>
          ))}
          {attachments?.map((attachment) => (
            <li key={attachment.id}>
              <AttachmentItem
                attachment={attachment}
                canDelete={!readOnly}
                role={role}
                userId={me?.id}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
