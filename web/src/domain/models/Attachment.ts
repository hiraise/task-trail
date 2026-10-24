import type { TaskId } from "../types";

import type { User } from "./User";

/** The attachment size limit (ADR-0037), the same as the server: a bigger file is not sent. */
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

/** A file attached to a task (ADR-0037). */
export interface Attachment {
  /** The file ID for GET /v1/files/{fileId} */
  id: string;
  taskId: TaskId;
  /** The original file name without a path */
  name: string;
  /** Detected by the server from the content, may carry parameters like `charset` */
  mimeType: string;
  /** Bytes */
  size: number;
  /** The uploader; shown even if they have left the project */
  author: User;
  /** ISO 8601 in UTC */
  createdAt: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** JPEG, PNG and WebP are shown as previews: the server serves only them inline (ADR-0013). */
export const isImageAttachment = (attachment: Attachment): boolean =>
  IMAGE_TYPES.includes(attachment.mimeType.split(";")[0].trim().toLowerCase());
