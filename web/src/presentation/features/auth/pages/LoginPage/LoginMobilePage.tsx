"use client";

import clsx from "clsx";
import Link from "next/link";


import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { BottomContent, LoginFormMobile, TitleWrapper } from "../../components";

import styles from "./LoginMobilePage.module.css";

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
