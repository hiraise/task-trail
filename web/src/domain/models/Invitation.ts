/** Куда ведёт ссылка приглашения (ADR-0016). */
export interface Invitation {
  email: string;
  projectName: string;
  /** Имя пригласившего, а если его нет — почта */
  invitedBy: string;
}
