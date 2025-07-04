import { BaseModalComponentProps } from "./modal.types";
import { BottomSheet } from "@/presentation/ui/BottomSheet/BottomSheet";
import { BackButton } from "@/presentation/ui/BackButton/BackButton";

export function BaseModal({
  children,
  showBackButton = true,
  ...props
}: BaseModalComponentProps) {
  const { isOpen, onClose, onBack } = props;
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {onBack && showBackButton && (
        <BackButton onClick={onBack} showLabel={false} />
      )}
      {children}
    </BottomSheet>
  );
}
