import styles from "./BaseModal.module.css";

import { BaseModalComponentProps } from "./BaseModal.types";
import { BottomSheet } from "@/presentation/ui/BottomSheet/BottomSheet";
import { BackButton } from "@/presentation/ui/BackButton/BackButton";

export function BaseModal<T = void>({
  children,
  showBackButton = false,
  title,
  ...props
}: BaseModalComponentProps<T>) {
  const { isOpen, onClose, onBack, fullScreen } = props;
  return (
    //TODO: refactor passing fullScreen prop
    // to BottomSheet, it should be handled in the component itself
    <BottomSheet isOpen={isOpen} onClose={onClose} fullScreen={fullScreen}>
      <div className={styles.container}>
        {onBack && showBackButton && (
          <BackButton className={styles.backButton} onClick={onBack} showLabel={false} />
        )}
        {title && <h2 className={styles.title}>{title}</h2>}
      </div>
      {children}
    </BottomSheet>
  );
}
