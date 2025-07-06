import CreateProjectModal from "../../presentation/widgets/modals/CreateProjectModal";
import InviteUserModal from "../../presentation/widgets/modals/InviteUserModal";
import { ProjectCreationProvider } from "../../presentation/widgets/projects/context/ProjectCreationContext";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import {
  closeAllSheets,
  backSheet,
} from "@/application/modals/bottomSheetSlice";
import { MODAL_TYPES } from "@/infrastructure/config/modalTypes";

export function SheetManager() {
  const stack = useAppSelector((state) => state.bottomSheet.stack);
  const dispatch = useAppDispatch();

  if (stack.length === 0) return null;

  const currentSheet = stack[stack.length - 1];
  const hasMultipleSheets = stack.length > 1;

  const handleBack = () => {
    if (hasMultipleSheets) {
      dispatch(backSheet());
    } else {
      dispatch(closeAllSheets());
    }
  };

  const handleClose = () => {
    dispatch(closeAllSheets());
  };

  const renderModal = () => {
    switch (currentSheet.type) {
      case MODAL_TYPES.CREATE_PROJECT:
        return (
          <CreateProjectModal
            isOpen={true}
            onClose={handleClose}
            onBack={hasMultipleSheets ? handleBack : undefined}
          />
        );

      case MODAL_TYPES.INVITE_USER:
        return (
          <InviteUserModal
            isOpen={true}
            onClose={handleClose}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  // All current modals are project creation related, so always wrap with context
  return <ProjectCreationProvider>{renderModal()}</ProjectCreationProvider>;
}
