import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AddMembersPayload } from "@/application/payloads";
import type { InvitationResult } from "@/domain/models/Invitation";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

import { useInvitationReport } from "./useInvitationReport";

/**
 * Invites people to the project by email. Registered users become members at once, the rest
 * get an invitation (ADR-0016). useInvitationReport shows the result per email;
 * `report: false` — for the results modal, which updates its own list.
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
