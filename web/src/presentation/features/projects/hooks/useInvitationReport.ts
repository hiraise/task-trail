import { toast } from "sonner";

import type { InvitationResult } from "@/domain/models/Invitation";
import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { projectsTexts } from "@/shared/locales/projects";
import { interpolate } from "@/shared/utils/interpolate";

const texts = projectsTexts.invitations;

/** The inviter must act: send a link themselves or invite again (ADR-0017). */
export const needsAttention = (results: InvitationResult[]): boolean =>
  results.some((result) => result.inviteUrl || result.outcome === "mail_failed");

/** Short summary for a toast: how many were added, invited and already in the project. */
export function invitationSummary(results: InvitationResult[]): string {
  const count = (outcome: InvitationResult["outcome"]) =>
    results.filter((result) => result.outcome === outcome).length;
  const lines: [string, number][] = [
    [texts.summaryAdded, count("added")],
    [texts.summaryInvited, count("invited")],
    [texts.summaryAlreadyMember, count("already_member")],
  ];

  return lines
    .filter(([, n]) => n > 0)
    .map(([template, n]) => interpolate(template, { count: String(n) }))
    .join(". ");
}

/**
 * Shows the invitation result per email. Links to send manually (mail disabled) and emails
 * that were not sent go to the InvitationResultsModal; the rest — to a toast.
 * Call it after the modal that invited is closed: modals open as a stack.
 */
export function useInvitationReport() {
  const { showInvitationResults } = useGlobalModals();

  return (projectId: ProjectId, results: InvitationResult[]) => {
    if (results.length === 0) return;
    if (needsAttention(results)) {
      showInvitationResults({ projectId, results });

      return;
    }
    toast.success(invitationSummary(results));
  };
}
