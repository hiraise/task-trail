import clsx from "clsx";

import styles from "./AuthScreen.module.css";

interface AuthScreenProps {
  title: string;
  description?: React.ReactNode;
  /** Декоративные иконки карточки — только на десктопе, как в макетах */
  decorations?: React.ReactNode;
  /** Строка внизу экрана, например «Нет аккаунта? Зарегистрироваться» */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Экран доступа: на телефоне и планшете содержимое лежит прямо на странице, на десктопе —
 * в белой карточке по центру (Figma, страница «Вход»).
 */
export function AuthScreen({ title, description, decorations, footer, children }: AuthScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.main}>
        <section className={styles.card}>
          {decorations && (
            <div className={styles.decorations} aria-hidden="true">
              {decorations}
            </div>
          )}
          <div className={styles.title}>
            <h1>{title}</h1>
            {description && <p className={clsx("body-reg", styles.description)}>{description}</p>}
          </div>
          {children}
        </section>
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}

/** Нижняя строка экрана: приглушённый текст и ссылка. */
export function AuthFooterText({ children }: { children: React.ReactNode }) {
  return <span className={clsx("body-reg-2", styles.footerText)}>{children}</span>;
}
