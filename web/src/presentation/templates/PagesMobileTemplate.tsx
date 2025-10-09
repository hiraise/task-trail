import styles from "./PagesMobileTemplate.module.css";

import { TopBarBackMobile } from "../widgets/common/TopBar";

interface PagesMobileTemplateProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  topBarBackTitle?: string;
  onMenuClick?: () => void;
}

export function PagesMobileTemplate({
  children,
  topBar,
  topBarBackTitle,
  onMenuClick,
}: PagesMobileTemplateProps) {
  return (
    <div className={styles.container}>
      {topBar && <div className={styles.topBar}>{topBar}</div>}
      {topBarBackTitle && (
        <div className={styles.topBarBack}>
          <TopBarBackMobile title={topBarBackTitle} onMenuClick={onMenuClick} />
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
