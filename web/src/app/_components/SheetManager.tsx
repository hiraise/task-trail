import CreateProjectModal from "../../presentation/widgets/modals/CreateProjectModal";
import InviteUserModal from "../../presentation/widgets/modals/InviteUserModal";
import { ProjectCreationProvider } from "../../application/projects/context/ProjectCreationContext";
import { MODAL_TYPES } from "@/infrastructure/config/modalTypes";
import { useBottomSheet } from "./BottomSheetContext";
import { ReactNode } from "react";

export function SheetManager() {
  const { stack, closeAllSheets, backSheet } = useBottomSheet();

  if (stack.length === 0) return null;

  const currentSheet = stack[stack.length - 1];
  const hasMultipleSheets = stack.length > 1;

  const handleBack = () => {
    if (hasMultipleSheets) {
      backSheet();
    } else {
      closeAllSheets();
    }
  };

  const handleClose = () => closeAllSheets();

  const renderModal = (): ReactNode => {
    const commonProps = {
      isOpen: true,
      onClose: handleClose,
      onBack: hasMultipleSheets ? handleBack : undefined,
    };

    switch (currentSheet.type) {
      case MODAL_TYPES.CREATE_PROJECT:
        return <CreateProjectModal {...commonProps} />;

      case MODAL_TYPES.INVITE_USER:
        return <InviteUserModal {...commonProps} />;

      default:
        console.warn(`Unknown modal type: ${currentSheet.type}`);
        return null;
    }
  };

  const getModalWithProvider = (modal: ReactNode): ReactNode => {
    const projectRelatedModals = [
      MODAL_TYPES.CREATE_PROJECT,
      MODAL_TYPES.INVITE_USER,
    ];

    if (projectRelatedModals.includes(currentSheet.type)) {
      return <ProjectCreationProvider>{modal}</ProjectCreationProvider>;
    }

    return modal;
  };

  return getModalWithProvider(renderModal());
}
