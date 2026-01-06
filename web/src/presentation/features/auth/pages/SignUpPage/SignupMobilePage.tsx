"use client";

import clsx from "clsx";
import Link from "next/link";

import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { BottomContent, SignupFormMobile, TitleWrapper } from "../../components";

import styles from "./SignupMobilePage.module.css";

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
