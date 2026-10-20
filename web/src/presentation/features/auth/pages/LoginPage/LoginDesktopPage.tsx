"use client";

import clsx from "clsx";
import Link from "next/link";

import { Icon } from "@/presentation/shared";
import { DESIGN_ELEMENTS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { AuthBackground, BottomContent, LoginFormDesktop, TitleWrapper } from "../../components";

import styles from "./LoginDesktopPage.module.css";




export function LoginDesktopPage() {
  return (
    <>
      <AuthBackground>
        <Icon as={DESIGN_ELEMENTS.search} className={styles.search} />
        <Icon as={DESIGN_ELEMENTS.task} className={styles.task} />
        <TitleWrapper>
          <h1>{authTexts.login.title}</h1>
          <p className="body-reg">{authTexts.login.description}</p>
        </TitleWrapper>
        <LoginFormDesktop />
      </AuthBackground>
      <BottomContent>
        <span className={clsx(styles.text, "body-reg-2")}>{authTexts.noAccount}</span>
        <Link href={ROUTES.signUp}>
          <span className="btn-font-s">{authTexts.signup.signup}</span>
        </Link>
      </BottomContent>
    </>
  );
}
