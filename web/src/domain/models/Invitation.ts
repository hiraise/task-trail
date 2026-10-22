/** Куда ведёт ссылка приглашения (ADR-0016). */
export interface Invitation {
  email: string;
  projectName: string;
  /** Имя пригласившего, а если его нет — почта */
  invitedBy: string;
}

/**
 * Что стало с почтой, которую позвали в проект: `added` — аккаунт есть, человек стал участником;
 * `invited` — создано приглашение; `already_member` — уже участник; `mail_failed` — приглашение
 * создано, но письмо не ушло, повторное приглашение отправит новое (ADR-0017).
 */
export type InvitationOutcome = "added" | "invited" | "already_member" | "mail_failed";

export interface InvitationResult {
  email: string;
  outcome: InvitationOutcome;
  /** Ссылка приглашения — только при `invited` и выключенной почте: её отправляет пригласивший */
  inviteUrl?: string;
}
