/** Where an invitation link leads (ADR-0016). */
export interface Invitation {
  email: string;
  projectName: string;
  /** The inviter's name, or their email if there is no name */
  invitedBy: string;
}

/**
 * What happened to an email invited to the project: `added` — the account exists, the person became a member;
 * `invited` — an invitation was created; `already_member` — already a member; `mail_failed` — the invitation
 * was created but the email was not sent; inviting again sends a new one (ADR-0017).
 */
export type InvitationOutcome = "added" | "invited" | "already_member" | "mail_failed";

export interface InvitationResult {
  email: string;
  outcome: InvitationOutcome;
  /** Invitation link — only for `invited` with mail disabled: the inviter sends it */
  inviteUrl?: string;
}
