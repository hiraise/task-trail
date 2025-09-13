import styles from "./DesktopLogin.module.css";

import { AuthBackground } from "./AuthBackground";
import { LoginDesktopForm } from "./LoginDesktopForm";
import { Icon } from "@/presentation/ui/Icon";
import { DESIGN_ELEMENTS } from "@/infrastructure/config/icons";
import { authTexts } from "@/shared/locales/auth";

export function DesktopLogin() {
  return (
    <AuthBackground>
      <div>
        <Icon as={DESIGN_ELEMENTS.search} className={styles.search} />
        <Icon as={DESIGN_ELEMENTS.task} className={styles.task} />
        <div className={styles.title}>
          <h1>{authTexts.login.title}</h1>
          <p className="body-reg">{authTexts.login.description}</p>
        </div>
      </div>
      <div className={styles.formWapper}>
        <LoginDesktopForm />
      </div>
    </AuthBackground>
  );
}
