import { useGlobalModalContext } from "@/presentation/app";

import { DeviceBased } from "../../components";
import { useScrollLock } from "../../hooks";
import { BottomSheet, BottomSheetTitle, Dialog, DialogTitle } from "../../ui";

import styles from "./BaseModal.module.css";
import type { BaseModalComponentProps } from "./BaseModal.types";

export function BaseModal<T = void>({
  children,
  showBackButton,
  title,
  ...props
}: BaseModalComponentProps<T>) {
  const { isOpen, onClose, onBack, fullScreen } = props;
  const { stack } = useGlobalModalContext();

  // Automatically determine if back button should be shown
  // Show back button if there's more than one modal in the stack, unless explicitly disabled
  const shouldShowBackButton = showBackButton ?? stack.length > 1;

  useScrollLock(isOpen);

  if (!isOpen) return null;

  //TODO: refactor passing fullScreen prop
  // to BottomSheet, it should be handled in the component itself

  return (
    <DeviceBased
      desktop={
        <Dialog>
          {title && (
            <DialogTitle
              title={title}
              onClose={onClose}
              onBack={onBack}
              showBackButton={shouldShowBackButton}
            />
          )}
          <div className={styles.desktop}>{children}</div>
        </Dialog>
      }
      mobile={
        <BottomSheet isOpen={isOpen} onClose={onClose} fullScreen={fullScreen}>
          {title && (
            <BottomSheetTitle title={title} onBack={onBack} showBackButton={shouldShowBackButton} />
          )}
          <div className={styles.mobile}>{children}</div>
        </BottomSheet>
      }
    />
  );
}
