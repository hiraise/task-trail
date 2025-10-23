"use client";

import styles from "./PasswordRecoveryMobilePage.module.css";

import { TitleWrapper } from "@/presentation/widgets/auth/_components";
import { PasswordRecoveryFormMobile } from "@/presentation/widgets/auth/PasswordRecoveryForm";
import { authTexts } from "@/shared/locales/auth";

export function PasswordRecoveryMobilePage() {
  return (
    <div className={styles.container}>
      <TitleWrapper>
        <h1>{authTexts.passwordRecovery.title}</h1>
        <p className="body-reg">{authTexts.passwordRecovery.description}</p>
      </TitleWrapper>
      <PasswordRecoveryFormMobile />
    </div>
  );
}
