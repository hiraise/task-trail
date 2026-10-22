import { Link, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { Icon } from "@/presentation/shared";
import { DESIGN_ELEMENTS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";
import { errorTexts } from "@/shared/locales/messages";

import { AuthFooterText, AuthScreen, LoginForm } from "../../components";
import { usePublicSettings } from "../../hooks";

import styles from "./LoginPage.module.css";

/**
 * Sign-in. With the `from` parameter, route protection sent the user here: show that sign-in is needed,
 * and after sign-in useLogin returns to `from`. The registration link is shown only while the service
 * has no users at all (ADR-0016).
 */
export function LoginPage() {
  const { from } = useSearch({ from: "/auth/" });
  const { data: settings } = usePublicSettings();

  useEffect(() => {
    if (from) toast.error(errorTexts.authenticationRequired);
  }, [from]);

  const footer = settings?.registrationOpen && (
    <>
      <AuthFooterText>{authTexts.noAccount}</AuthFooterText>
      <Link to={ROUTES.signUp}>
        <span className="btn-font-s">{authTexts.signup.signup}</span>
      </Link>
    </>
  );

  return (
    <AuthScreen
      title={authTexts.login.title}
      description={authTexts.login.description}
      decorations={
        <>
          <Icon as={DESIGN_ELEMENTS.search} className={styles.search} />
          <Icon as={DESIGN_ELEMENTS.task} className={styles.task} />
        </>
      }
      footer={footer}
    >
      <LoginForm />
    </AuthScreen>
  );
}
