import {
  closeAllSheets,
  backSheet,
} from "@/application/modals/bottomSheetSlice";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { MODAL_TYPES } from "@/infrastructure/config/modalTypes";
import CreateProjectModal from "../../presentation/widgets/modals/CreateProjectModal";
import InviteUserModal from "../../presentation/widgets/modals/InviteUserModal";

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

  switch (currentSheet.type) {
    case MODAL_TYPES.CREATE_PROJECT:
      return (
        <CreateProjectModal
          isOpen={true}
          onClose={handleClose}
          onBack={hasMultipleSheets ? handleBack : undefined}
          {...(currentSheet.props || {})}
        />
      );

    case MODAL_TYPES.INVITE_USER:
      return (
        <InviteUserModal
          isOpen={true}
          onClose={handleClose}
          onBack={handleBack}
          {...(currentSheet.props || {})}
        />
      );

    default:
      return null;
  }
}
