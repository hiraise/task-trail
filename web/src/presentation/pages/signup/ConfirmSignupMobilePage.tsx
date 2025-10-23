"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import styles from "./ConfirmSignupMobilePage.module.css";

import { useResendEmail } from "@/application/auth/hooks/useResendEmail";
import { authTexts } from "@/shared/locales/auth";
import { SubmitButton, TitleWrapper } from "@/presentation/widgets/auth/_components";
import { ASSETS } from "@/infrastructure/config/assets";
import { ResendEmailButton } from "@/presentation/widgets/auth/ResendEmailButton";
import { openUserInbox } from "@/shared/utils/openUserInbox";

export function ConfirmSignupMobilePage() {
  const email = useSearchParams().get("email") || "";
  const { mutateAsync: resendVerification } = useResendEmail();

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
          src={ASSETS.images.resendVerification}
          alt={authTexts.checkEmailAlt}
          width={400}
          height={224}
        />
      </div>
      <div className={styles.buttons}>
        <ResendEmailButton initialDelay={10} onResend={() => resendVerification(email)} />
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
