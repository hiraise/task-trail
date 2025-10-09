import styles from "./PagesMobileTemplate.module.css";

import { TopBarBackMobile } from "../widgets/common/TopBar";

interface PagesMobileTemplateProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  topBarBackTitle?: string;
  onMenuClick?: () => void;
  onSortClick?: () => void;
}

export function PagesMobileTemplate({
  children,
  topBar,
  topBarBackTitle,
  onMenuClick,
  onSortClick,
}: PagesMobileTemplateProps) {
  return (
    <div className={styles.container}>
      {topBar && <div className={styles.topBar}>{topBar}</div>}
      {topBarBackTitle && (
        <div className={styles.topBarBack}>
          <TopBarBackMobile
            title={topBarBackTitle}
            onMenuClick={onMenuClick}
            onSortClick={onSortClick}
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
