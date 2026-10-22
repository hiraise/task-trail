import { Link } from "@tanstack/react-router";

import { Icon } from "@/presentation/shared";
import { DESIGN_ELEMENTS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { AuthFooterText, AuthScreen, SignupForm } from "../../components";

import styles from "./SignupPage.module.css";

/** Регистрация первого аккаунта; когда пользователи есть, маршрут ведёт на вход (ADR-0016). */
export function SignupPage() {
  return (
    <AuthScreen
      title={authTexts.signup.title}
      description={authTexts.signup.description}
      decorations={
        <>
          <Icon as={DESIGN_ELEMENTS.picture} className={styles.picture} />
          <Icon as={DESIGN_ELEMENTS.lock} className={styles.lock} />
        </>
      }
      footer={
        <>
          <AuthFooterText>{authTexts.hasAccount}</AuthFooterText>
          <Link to={ROUTES.login}>
            <span className="btn-font-s">{authTexts.login.login}</span>
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthScreen>
  );
}
