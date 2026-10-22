import { useNavigate, useSearch } from "@tanstack/react-router";

import { LoadingScreen, SubmitButton } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";
import { hasErrorCode } from "@/shared/errors/types";
import { authTexts } from "@/shared/locales/auth";
import { interpolate } from "@/shared/utils/interpolate";

import { AuthScreen, InviteForm } from "../../components";
import { useInvitation } from "../../hooks";

import styles from "./InvitePage.module.css";

/**
 * Принятие приглашения по ссылке `<адрес сервиса>/auth/invite?token=…` (ADR-0016). Экрана нет
 * в Figma — он собран из компонентов экрана регистрации.
 */
export function InvitePage() {
  const { token } = useSearch({ from: "/auth/invite/" });
  const { data: invitation, error, isPending, refetch } = useInvitation(token);

  if (!token || hasErrorCode(error, "LINK_INVALID")) {
    return (
      <InviteMessage
        title={authTexts.invite.invalidTitle}
        description={authTexts.invite.invalidDescription}
      />
    );
  }

  // Аккаунт с почтой приглашения уже есть — ссылка ведёт на вход, даже если истекла
  if (hasErrorCode(error, "INVITATION_ACCEPTED")) {
    return (
      <InviteMessage
        title={authTexts.invite.acceptedTitle}
        description={authTexts.invite.acceptedDescription}
      />
    );
  }

  if (error) {
    return (
      <AuthScreen title={authTexts.invite.failedTitle} description={authTexts.invite.failedDescription}>
        <SubmitButton className="btn-font-m" onClick={() => refetch()}>
          {authTexts.invite.retry}
        </SubmitButton>
      </AuthScreen>
    );
  }

  if (isPending) {
    return (
      <AuthScreen title={authTexts.invite.title}>
        <div className={styles.loading}>
          <LoadingScreen />
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={authTexts.invite.title}
      description={interpolate(authTexts.invite.description, {
        invitedBy: invitation.invitedBy,
        projectName: invitation.projectName,
      })}
    >
      <InviteForm token={token} email={invitation.email} />
    </AuthScreen>
  );
}

function InviteMessage({ title, description }: { title: string; description: string }) {
  const navigate = useNavigate();

  return (
    <AuthScreen title={title} description={description}>
      <SubmitButton
        className="btn-font-m"
        onClick={() => navigate({ to: ROUTES.login, replace: true })}
      >
        {authTexts.login.login}
      </SubmitButton>
    </AuthScreen>
  );
}
