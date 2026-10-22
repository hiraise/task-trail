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
 * Вход. С параметром `from` сюда отправила защита маршрутов: показываем, что нужен вход,
 * а после входа useLogin вернёт на `from`. Ссылка на регистрацию — только пока в сервисе
 * нет ни одного пользователя (ADR-0016).
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
