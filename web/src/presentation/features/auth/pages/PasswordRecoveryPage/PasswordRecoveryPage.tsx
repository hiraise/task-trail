import { useNavigate } from "@tanstack/react-router";

import { SubmitButton } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { AuthScreen, PasswordRecoveryForm } from "../../components";
import { usePublicSettings } from "../../hooks";

/**
 * Password recovery by email. Without mail no email is sent: the reset link is issued by
 * the service administrator (ADR-0017), so an explanation is shown instead of the form.
 */
export function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const { data: settings } = usePublicSettings();

  if (settings?.mailEnabled === false) {
    return (
      <AuthScreen
        title={authTexts.passwordRecovery.title}
        description={authTexts.passwordRecovery.mailDisabledDescription}
      >
        <SubmitButton className="btn-font-m" onClick={() => navigate({ to: ROUTES.login })}>
          {authTexts.backToLogin}
        </SubmitButton>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={authTexts.passwordRecovery.title}
      description={authTexts.passwordRecovery.description}
    >
      <PasswordRecoveryForm />
    </AuthScreen>
  );
}
