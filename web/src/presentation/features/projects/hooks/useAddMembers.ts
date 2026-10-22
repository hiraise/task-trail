import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AddMembersPayload } from "@/application/payloads";
import type { InvitationResult } from "@/domain/models/Invitation";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

import { useInvitationReport } from "./useInvitationReport";

/**
 * Зовёт людей в проект по почте. Зарегистрированные сразу становятся участниками, остальным
 * уходит приглашение (ADR-0016). Результат по каждой почте показывает useInvitationReport;
 * `report: false` — для окна результатов, которое само обновляет свой список.
 */
export function useAddMembers({ report = true }: { report?: boolean } = {}) {
  const queryClient = useQueryClient();
  const reportInvitations = useInvitationReport();

  return useMutation<InvitationResult[], Error, AddMembersPayload>({
    mutationFn: ({ projectId, emails }) => projectMemberRepository.addByEmails(projectId, emails),
    onSuccess: (results, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.members(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.candidates.byProject(projectId) });
      if (report) reportInvitations(projectId, results);
    },
    onError: (error) => toastError(error, projectsTexts.inviteFailed),
  });
}
