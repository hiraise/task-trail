import { Navigate, useSearch } from "@tanstack/react-router";

import { SubmitButton } from "@/presentation/shared";
import { ASSETS } from "@/shared/config/assets";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";
import { openUserInbox } from "@/shared/utils/openUserInbox";

import { AuthScreen, ResendEmailButton } from "../../components";
import { useRecoveryPassword } from "../../hooks";

import styles from "./PasswordRecoveryConfirmPage.module.css";

/** «Проверьте вашу почту» после запроса ссылки сброса; почта — в параметре `email`. */
export function PasswordRecoveryConfirmPage() {
  const { email } = useSearch({ from: "/auth/password-recovery/confirm" });
  const { mutate: recover } = useRecoveryPassword({ navigateOnSuccess: false });

  if (!email) return <Navigate to={ROUTES.passwordRecovery} replace />;

  return (
    <AuthScreen title={authTexts.checkEmailTitle} description={<CheckEmailMessage email={email} />}>
      <img
        className={styles.cover}
        src={ASSETS.images.passwordRecovery}
        alt={authTexts.checkEmailAlt}
        width={400}
        height={224}
      />
      <div className={styles.buttons}>
        <ResendEmailButton initialDelay={10} onResend={() => recover({ email })} />
        <SubmitButton className="btn-font-m" onClick={() => openUserInbox(email)}>
          {authTexts.openEmail}
        </SubmitButton>
      </div>
    </AuthScreen>
  );
}

function CheckEmailMessage({ email }: { email: string }) {
  const [before, after] = authTexts.checkEmailDescription.split("{email}");

  return (
    <>
      {before}
      <span className="body-med">{email}</span>
      {after}
    </>
  );
}
