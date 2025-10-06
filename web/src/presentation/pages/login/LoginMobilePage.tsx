"use client";

import Link from "next/link";
import clsx from "clsx";

import styles from "./LoginMobilePage.module.css";

import { ROUTES } from "@/infrastructure/config/routes";
import { LoginFormMobile } from "@/presentation/widgets/auth/LoginForm/LoginFormMobile";
import { authTexts } from "@/shared/locales/auth";
import { BottomContent, TitleWrapper } from "@/presentation/widgets/auth/_components";

export function LoginMobilePage() {
  return (
    <div className={styles.container}>
      <TitleWrapper>
        <h1>{authTexts.login.title}</h1>
        <p className="body-reg">{authTexts.login.description}</p>
      </TitleWrapper>
      <LoginFormMobile />
      <BottomContent>
        <span className={clsx(styles.text, "body-reg-2")}>{authTexts.noAccount}</span>
        <Link href={ROUTES.signUp}>
          <span className="btn-font-s">{authTexts.signup.signup}</span>
        </Link>
      </BottomContent>
    </div>
  );
}
