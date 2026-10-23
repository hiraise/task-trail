import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { DeleteLabelPayload } from "@/application/payloads";
import { labelRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { labelsTexts } from "@/shared/locales/labels";

import { invalidateLabelCaches } from "./labelCache";

/** The owner and admins delete a label; the server removes it from every task (ADR-0035). */
export function useDeleteLabel() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteLabelPayload>({
    mutationFn: ({ projectId, labelId }) => labelRepository.delete(projectId, labelId),
    onSuccess: async (_, { projectId }) => {
      toast.success(labelsTexts.labelDeleted);
      await invalidateLabelCaches(queryClient, projectId);
    },
    onError: (error) => toastError(error, labelsTexts.deleteLabelFailed),
  });
}
