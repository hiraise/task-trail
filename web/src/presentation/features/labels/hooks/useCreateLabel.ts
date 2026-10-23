import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateLabelPayload } from "@/application/payloads";
import type { Label } from "@/domain/models/Label";
import { labelRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { tasksTexts } from "@/shared/locales/tasks";

/** Any project member creates a label (ADR-0035); a taken name is shown by the caller under its field. */
export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation<Label, Error, CreateLabelPayload>({
    mutationFn: ({ projectId, data }) => labelRepository.create(projectId, data),
    onSuccess: (_, { projectId }) =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.labels(projectId) }),
    onError: (error) => {
      if (!hasErrorCode(error, "LABEL_NAME_TAKEN")) toastError(error, tasksTexts.createLabelFailed);
    },
  });
}
