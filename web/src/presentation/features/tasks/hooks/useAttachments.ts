import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { MAX_ATTACHMENT_SIZE, type Attachment } from "@/domain/models/Attachment";
import type { TaskId } from "@/domain/types";
import { fileRepository, taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { tasksTexts } from "@/shared/locales/tasks";
import { interpolate } from "@/shared/utils/interpolate";
import { saveBlob } from "@/shared/utils/saveBlob";

/** The task's attachments, newest first (ADR-0037). */
export function useTaskAttachments(taskId: TaskId) {
  return useQuery<Attachment[], Error>({
    queryKey: QUERY_KEYS.task.attachments(taskId),
    queryFn: () => taskRepository.findAttachments(taskId),
    enabled: !!taskId,
  });
}

/** A file waiting for its upload: the block shows a dimmed row for it. */
export interface PendingUpload {
  key: string;
  file: File;
}

let uploadSeq = 0;

/**
 * Uploads files one by one. A file over 25 MB is not sent (ADR-0037): it only gets a toast. A failed
 * upload gets its own toast and the rest continue; each uploaded file appears in the list at once.
 */
export function useUploadAttachments(taskId: TaskId) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.task.attachments(taskId);
  const [pending, setPending] = useState<PendingUpload[]>([]);

  const mutation = useMutation<void, Error, PendingUpload[]>({
    mutationFn: async (uploads) => {
      for (const upload of uploads) {
        try {
          const attachment = await taskRepository.uploadAttachment(taskId, upload.file);

          queryClient.setQueryData<Attachment[]>(queryKey, (list) => list && [attachment, ...list]);
        } catch (error) {
          toastError(error, interpolate(tasksTexts.uploadFailed, { name: upload.file.name }));
        } finally {
          setPending((items) => items.filter((item) => item.key !== upload.key));
        }
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const upload = (files: File[]) => {
    const uploads: PendingUpload[] = [];

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(interpolate(tasksTexts.attachmentTooLarge, { name: file.name }));
      } else {
        uploads.push({ key: `upload-${(uploadSeq += 1)}`, file });
      }
    }
    if (uploads.length === 0) return;

    setPending((items) => [...items, ...uploads]);
    mutation.mutate(uploads);
  };

  return { upload, pending, isPending: mutation.isPending };
}

/** The uploader, the project owner or a project admin (ADR-0037). */
export function useDeleteAttachment(taskId: TaskId) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (fileId) => taskRepository.deleteAttachment(taskId, fileId),
    onSuccess: () => {
      toast.success(tasksTexts.attachmentDeleted);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task.attachments(taskId) });
    },
    onError: (error) => toastError(error, tasksTexts.deleteAttachmentFailed),
  });
}

/**
 * Downloads through the API client so an expired session is refreshed (ADR-0037). The error body of
 * a blob request carries no API code, so any failure shows the same text.
 */
export function useDownloadAttachment() {
  return useMutation<Blob, Error, Attachment>({
    mutationFn: (attachment) => fileRepository.download(attachment.id),
    onSuccess: (blob, attachment) => saveBlob(blob, attachment.name),
    onError: (error) => toastError(error, tasksTexts.downloadFailed),
  });
}
