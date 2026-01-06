"use client";

import { authTexts } from "@/shared/locales/auth";

import { TitleWrapper } from "../../components";
import { PasswordRecoveryFormMobile } from "../../components/PasswordRecoveryForm";

import styles from "./PasswordRecoveryMobilePage.module.css";

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
