import { TopBarBackMobile, type Variant } from "../TopBar";

import styles from "./PagesMobileTemplate.module.css";

interface PagesMobileTemplateProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  topBarBackTitle?: string;
  variant?: Variant;
  onActionClick?: () => void;
  /** Куда ведёт «назад» верхней панели; без него — на уровень выше по адресу */
  backTo?: string;
}

export function PagesMobileTemplate({
  children,
  topBar,
  topBarBackTitle,
  variant = "none",
  onActionClick,
  backTo,
}: PagesMobileTemplateProps) {
  return (
    <div className={styles.container}>
      {topBar && <div className={styles.topBar}>{topBar}</div>}
      {topBarBackTitle && (
        <div className={styles.topBarBack}>
          <TopBarBackMobile
            title={topBarBackTitle}
            variant={variant}
            onActionClick={onActionClick}
            backTo={backTo}
          />
        </div>
      )}

      <div className={styles.contentWrapper}>
        {Array.isArray(children) ? (
          children.map((child, index) => (
            <div key={index} className={styles.content}>
              {child}
            </div>
          ))
        ) : (
          <div className={styles.content}>{children}</div>
        )}
      </div>
    </div>
  );
}
