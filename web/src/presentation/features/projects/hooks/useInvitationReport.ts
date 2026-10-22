import { toast } from "sonner";

import type { InvitationResult } from "@/domain/models/Invitation";
import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { projectsTexts } from "@/shared/locales/projects";
import { interpolate } from "@/shared/utils/interpolate";

const texts = projectsTexts.invitations;

/** Пригласившему нужно что-то сделать: отправить ссылку сам или позвать снова (ADR-0017). */
export const needsAttention = (results: InvitationResult[]): boolean =>
  results.some((result) => result.inviteUrl || result.outcome === "mail_failed");

/** Короткий итог для тоста: сколько добавлено, приглашено и уже было в проекте. */
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
 * Показывает результат приглашения по каждой почте. Ссылки для отправки вручную (почта
 * выключена) и письма, которые не ушли, — в окне InvitationResultsModal; остальное — тостом.
 * Вызывай, когда окно, из которого звали, уже закрыто: окна открываются стеком.
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
