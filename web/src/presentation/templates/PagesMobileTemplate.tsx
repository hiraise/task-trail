import styles from "./PagesMobileTemplate.module.css";

import { TopBarBackMobile } from "../widgets/common/TopBar";

interface PagesMobileTemplateProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  topBarBackTitle?: string;
}

export function PagesMobileTemplate({
  children,
  topBar,
  topBarBackTitle,
}: PagesMobileTemplateProps) {
  return (
    <div className={styles.container}>
      {topBar && <div className={styles.topBar}>{topBar}</div>}
      {topBarBackTitle && (
        <div className={styles.topBarBack}>
          <TopBarBackMobile title={topBarBackTitle} />
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
