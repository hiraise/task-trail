import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateLabelPayload } from "@/application/payloads";
import type { Label } from "@/domain/models/Label";
import { labelRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { labelsTexts } from "@/shared/locales/labels";

import { invalidateLabelCaches } from "./labelCache";

/** The owner and admins rename and recolor a label (ADR-0035); a taken name is shown by the form. */
export function useUpdateLabel() {
  const queryClient = useQueryClient();

  return useMutation<Label, Error, UpdateLabelPayload>({
    mutationFn: ({ projectId, labelId, changes }) => labelRepository.update(projectId, labelId, changes),
    onSuccess: async (_, { projectId }) => {
      toast.success(labelsTexts.labelUpdated);
      await invalidateLabelCaches(queryClient, projectId);
    },
    onError: (error) => {
      if (!hasErrorCode(error, "LABEL_NAME_TAKEN")) toastError(error, labelsTexts.updateLabelFailed);
    },
  });
}
