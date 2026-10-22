import clsx from "clsx";

import styles from "./AuthScreen.module.css";

interface AuthScreenProps {
  title: string;
  description?: React.ReactNode;
  /** Decorative card icons: desktop only, as in the mockups */
  decorations?: React.ReactNode;
  /** Line at the bottom of the screen, e.g. "No account? Sign up" */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Auth screen: on a phone and a tablet the content sits right on the page, on a desktop
 * in a white card in the center (Figma, page "Sign in").
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

/** Bottom line of the screen: muted text and a link. */
export function AuthFooterText({ children }: { children: React.ReactNode }) {
  return <span className={clsx("body-reg-2", styles.footerText)}>{children}</span>;
}
