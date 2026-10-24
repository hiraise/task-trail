import clsx from "clsx";

import { isImageAttachment, type Attachment } from "@/domain/models/Attachment";
import type { ProjectRole } from "@/domain/types";
import { getUserDisplayName } from "@/domain/models/User";
import { fileUrl } from "@/infrastructure/config/apiRoutes";
import { DropdownMenu, Icon, IconButton } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";
import { formatDate, formatFileSize } from "@/shared/utils/formatters";
import { interpolate } from "@/shared/utils/interpolate";
import { canDeleteComment } from "@/shared/utils/userRole";

import { useDeleteAttachment, useDownloadAttachment } from "../../hooks";

import styles from "./TaskAttachments.module.css";

interface AttachmentItemProps {
  attachment: Attachment;
  /** False for an archived task: only the download item stays */
  canDelete: boolean;
  role: ProjectRole;
  /** The current user's ID */
  userId?: string;
}

/**
 * A file row: a click downloads it. The «…» menu sits next to the download button, not inside it,
 * so a click on the menu does not download. Delete follows the comment rule: the uploader,
 * the owner and admins (ADR-0037).
 */
export function AttachmentItem({ attachment, canDelete, role, userId }: AttachmentItemProps) {
  const { mutate: download } = useDownloadAttachment();
  const { mutate: remove } = useDeleteAttachment(attachment.taskId);
  const { showConfirm } = useGlobalModals();
  const isAuthor = attachment.author.id === userId;

  const menuItems: MenuItem[] = [
    {
      label: tasksTexts.download,
      icon: ICONS.download,
      color: "var(--icon-tertiary)",
      onClick: () => download(attachment),
      isVisible: true,
    },
    {
      label: tasksTexts.deleteAttachment,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        const confirmed = await showConfirm({
          title: interpolate(tasksTexts.deleteAttachmentTitle, { name: attachment.name }),
          description: tasksTexts.deleteAttachmentDescription,
          confirmText: tasksTexts.deleteAttachment,
        });

        if (confirmed) remove(attachment.id);
      },
      isVisible: canDelete && canDeleteComment(role, isAuthor),
    },
  ].filter((item) => item.isVisible);

  const meta = [
    formatFileSize(attachment.size),
    getUserDisplayName(attachment.author),
    formatDate(attachment.createdAt),
  ].join(" · ");

  return (
    <div className={styles.row}>
      <button type="button" className={styles.main} onClick={() => download(attachment)}>
        {isImageAttachment(attachment) ? (
          <img className={styles.preview} src={fileUrl(attachment.id)} alt={attachment.name} />
        ) : (
          <span className={styles.thumb} data-testid="attachment-file-icon">
            <Icon as={ICONS.file} size="24px" inheritColor aria-hidden />
          </span>
        )}
        <span className={styles.text}>
          <span className={clsx("body-med-2", styles.name)}>{attachment.name}</span>
          <span className={clsx("caption-reg", styles.secondary, styles.meta)}>{meta}</span>
        </span>
      </button>
      <DropdownMenu
        trigger={
          <IconButton icon={ICONS.menu} size="24px" aria-label={tasksTexts.attachmentActions} />
        }
        items={menuItems}
      />
    </div>
  );
}

/** A file still uploading (agreed deviation 2 of step 0): dimmed, no actions. */
export function PendingItem({ name }: { name: string }) {
  return (
    <div className={clsx(styles.row, styles.pending)} aria-busy="true">
      <span className={styles.main}>
        <span className={styles.thumb}>
          <Icon as={ICONS.file} size="24px" inheritColor aria-hidden />
        </span>
        <span className={styles.text}>
          <span className={clsx("body-med-2", styles.name)}>{name}</span>
          <span className={clsx("caption-reg", styles.secondary)}>{tasksTexts.uploading}</span>
        </span>
      </span>
    </div>
  );
}
