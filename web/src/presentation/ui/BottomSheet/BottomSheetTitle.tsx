import styles from "./BottomSheetTitle.module.css";

import { BackButton } from "../BackButton";

interface BottomSheetTitleProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function BottomSheetTitle({ title, showBackButton, onBack }: BottomSheetTitleProps) {
  return (
    <div className={styles.container}>
      {onBack && showBackButton && (
        <BackButton className={styles.backButton} onClick={onBack} showLabel={false} />
      )}
      {title && <h2 className={styles.title}>{title}</h2>}
    </div>
  );
}
