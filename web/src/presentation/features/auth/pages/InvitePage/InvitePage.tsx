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
 * Accepting an invitation via the link `<service URL>/auth/invite?token=…` (ADR-0016). There is no screen
 * in Figma: it is built from the registration screen components.
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

  // An account with the invitation email already exists: the link leads to sign-in, even if expired
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
