"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import styles from "./ConfirmPasswordRecoveryMobilePage.module.css";

import { authTexts } from "@/shared/locales/auth";
import { openUserInbox } from "@/shared/utils/openUserInbox";
import { ASSETS } from "@/infrastructure/config/assets";
import { useResendEmail } from "@/application/auth/hooks/useResendEmail";
import { ResendEmailButton } from "@/presentation/widgets/auth/ResendEmailButton";
import { SubmitButton, TitleWrapper } from "@/presentation/widgets/auth/_components";

export function ConfirmPasswordRecoveryMobilePage() {
  const email = useSearchParams().get("email") || "";
  const { mutateAsync: resendEmail } = useResendEmail(email);

  if (email.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <TitleWrapper>
          <h1>{authTexts.checkEmailTitle}</h1>
          <CheckEmailMessage email={email} />
        </TitleWrapper>

        <Image
          className={styles.cover}
          src={ASSETS.images.passwordRecovery}
          alt={authTexts.checkEmailAlt}
          width={400}
          height={224}
        />
      </div>
      <div className={styles.buttons}>
        <ResendEmailButton initialDelay={10} onResend={() => resendEmail(email)} />
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
  const parts = authTexts.checkEmailDescription.split("{email}");

  return (
    <p className="body-reg">
      {parts[0]}
      <span className="body-med">{email}</span>
      {parts[1]}
    </p>
  );
}
