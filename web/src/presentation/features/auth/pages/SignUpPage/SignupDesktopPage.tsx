"use client";

import clsx from "clsx";
import Link from "next/link";

import { Icon } from "@/presentation/shared";
import { DESIGN_ELEMENTS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { AuthBackground, BottomContent, SignupFormDesktop, TitleWrapper } from "../../components";

import styles from "./SignupDesktopPage.module.css";




export function SignupDesktopPage() {
  return (
    <>
      <AuthBackground>
        <Icon as={DESIGN_ELEMENTS.picture} className={styles.picture} />
        <Icon as={DESIGN_ELEMENTS.lock} className={styles.lock} />
        <TitleWrapper>
          <h1>{authTexts.signup.title}</h1>
          <p className="body-reg">{authTexts.signup.description}</p>
        </TitleWrapper>
        <SignupFormDesktop />
      </AuthBackground>
      <BottomContent>
        <span className={clsx(styles.text, "body-reg-2")}>{authTexts.hasAccount}</span>
        <Link href={ROUTES.login}>
          <span className="btn-font-s">{authTexts.login.login}</span>
        </Link>
      </BottomContent>
    </>
  );
}
