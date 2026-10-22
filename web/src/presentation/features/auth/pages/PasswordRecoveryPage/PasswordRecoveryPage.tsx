import { useNavigate } from "@tanstack/react-router";

import { SubmitButton } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { AuthScreen, PasswordRecoveryForm } from "../../components";
import { usePublicSettings } from "../../hooks";

/**
 * Восстановление пароля по почте. Без почты письмо не уйдёт: ссылку сброса выдаёт
 * администратор сервиса (ADR-0017), поэтому вместо формы — объяснение.
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
