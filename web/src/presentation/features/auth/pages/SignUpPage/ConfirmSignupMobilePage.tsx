import { useSearch } from "@tanstack/react-router";

import { SubmitButton } from "@/presentation/shared";
import { ASSETS } from "@/shared/config/assets";
import { authTexts } from "@/shared/locales/auth";
import { openUserInbox } from "@/shared/utils/openUserInbox";

import { ResendEmailButton, TitleWrapper } from "../../components";
import { useResendEmailVerification } from "../../hooks";

import styles from "./ConfirmSignupMobilePage.module.css";

export function ConfirmSignupMobilePage() {
  const { email } = useSearch({ from: "/auth/signup/confirm" });
  const { mutateAsync: resendVerification } = useResendEmailVerification();

  if (!email || email.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <TitleWrapper>
          <h1>{authTexts.checkEmailTitle}</h1>
          <CheckEmailMessage email={email} />
        </TitleWrapper>

        <img
          className={styles.cover}
          src={ASSETS.images.resendVerification}
          alt={authTexts.checkEmailAlt}
          width={400}
          height={224}
        />
      </div>
      <div className={styles.buttons}>
        <ResendEmailButton initialDelay={10} onResend={() => resendVerification({ email })} />
        <SubmitButton className="btn-font-m" onClick={() => openUserInbox(email)}>
          {authTexts.openEmail}
        </SubmitButton>
      </div>
    </div>
  );
}

interface CheckEmailMessageProps {
  email: string;
}

function CheckEmailMessage({ email }: CheckEmailMessageProps) {
  const parts = authTexts.checkEmailDescription2.split("{email}");

  return (
    <p className="body-reg">
      {parts[0]}
      <span className="body-med">{email}</span>
      {parts[1]}
    </p>
  );
}
