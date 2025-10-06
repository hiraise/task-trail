"use client";

import Link from "next/link";
import clsx from "clsx";

import styles from "./SignupMobilePage.module.css";

import { ROUTES } from "@/infrastructure/config/routes";
import { BottomContent, TitleWrapper } from "@/presentation/widgets/auth/_components";
import { SignupFormMobile } from "@/presentation/widgets/auth/SignUpForm";
import { authTexts } from "@/shared/locales/auth";

export function SignupMobilePage() {
  return (
    <div className={styles.container}>
      <TitleWrapper>
        <h1>{authTexts.signup.title}</h1>
        <p className="body-reg">{authTexts.signup.description}</p>
      </TitleWrapper>
      <SignupFormMobile />
      <BottomContent>
        <span className={clsx(styles.text, "body-reg-2")}>{authTexts.hasAccount}</span>
        <Link href={ROUTES.login}>
          <span className="btn-font-s">{authTexts.login.login}</span>
        </Link>
      </BottomContent>
    </div>
  );
}
