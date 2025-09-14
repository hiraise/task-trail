"use client";

import Link from "next/link";
import clsx from "clsx";

import styles from "./LoginDesktopPage.module.css";

import { authTexts } from "@/shared/locales/auth";
import { ROUTES } from "@/infrastructure/config/routes";
import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { LoginFormDesktop } from "@/presentation/widgets/auth/LoginForm";
import {
  AuthBackground,
  BottomContent,
  TitleWrapper,
} from "@/presentation/widgets/auth/_components";

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
