import { useBottomSheet } from "@/app/_components/BottomSheetContext";

export function useSheetNavigation() {
  const { stack, closeAllSheets, backSheet } = useBottomSheet();

  const hasMultipleSheets = stack.length > 1;

  const handleBack = () => {
    if (hasMultipleSheets) {
      backSheet();
    } else {
      closeAllSheets();
    }
  };

  const handleClose = () => closeAllSheets();

  const getCommonProps = () => ({
    isOpen: true,
    onClose: handleClose,
    onBack: hasMultipleSheets ? handleBack : undefined,
  });

  return {
    isEmpty: stack.length === 0,
    currentSheet: stack[stack.length - 1],
    getCommonProps,
  };
}
