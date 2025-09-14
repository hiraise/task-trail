"use client";

import Link from "next/link";
import clsx from "clsx";

import styles from "./SignupDesktopPage.module.css";

import { authTexts } from "@/shared/locales/auth";
import { ROUTES } from "@/infrastructure/config/routes";
import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { SignupFormDesktop } from "@/presentation/widgets/auth/SignUpForm";
import {
  AuthBackground,
  BottomContent,
  TitleWrapper,
} from "@/presentation/widgets/auth/_components";

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
