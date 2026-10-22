import { useNavigate, useSearch } from "@tanstack/react-router";

import { SubmitButton } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";
import { hasErrorCode } from "@/shared/errors/types";
import { authTexts } from "@/shared/locales/auth";

import { AuthScreen, PasswordResetForm } from "../../components";
import { useResetPassword } from "../../hooks";

/**
 * A new password via the link `<service URL>/auth/reset?token=…`. If the link is wrong, expired or
 * already used (`LINK_INVALID`), suggest requesting a new one.
 */
export function PasswordResetPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/auth/reset/" });
  const { mutate: resetPassword, isPending, error } = useResetPassword();

  if (!token || hasErrorCode(error, "LINK_INVALID")) {
    return (
      <AuthScreen
        title={authTexts.passwordReset.invalidTitle}
        description={authTexts.passwordReset.invalidDescription}
      >
        <SubmitButton
          className="btn-font-m"
          onClick={() => navigate({ to: ROUTES.passwordRecovery, replace: true })}
        >
          {authTexts.passwordReset.requestNewLink}
        </SubmitButton>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={authTexts.passwordReset.title}
      description={authTexts.passwordReset.description}
    >
      <PasswordResetForm
        onSubmit={(password) => resetPassword({ password, token })}
        isPending={isPending}
      />
    </AuthScreen>
  );
}
