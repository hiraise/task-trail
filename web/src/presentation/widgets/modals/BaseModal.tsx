import { BaseModalComponentProps } from "./BaseModal.types";
import { BottomSheet } from "@/presentation/ui/BottomSheet/BottomSheet";
import { Dialog } from "@/presentation/ui/Dialog";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useScrollLock } from "@/shared/hooks/useScrollLock";
import { DialogTitle } from "@/presentation/ui/Dialog/DialogTitle";
import { BottomSheetTitle } from "@/presentation/ui/BottomSheet/BottomSheetTitle";
import { useGlobalModalContext } from "@/app/_components/GlobalModalContext";

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
          {children}
        </Dialog>
      }
      mobile={
        <BottomSheet isOpen={isOpen} onClose={onClose} fullScreen={fullScreen}>
          {title && (
            <BottomSheetTitle title={title} onBack={onBack} showBackButton={shouldShowBackButton} />
          )}
          {children}
        </BottomSheet>
      }
    />
  );
}
