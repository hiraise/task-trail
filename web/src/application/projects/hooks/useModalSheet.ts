import { useBottomSheet } from "@/app/_components/BottomSheetContext";
import { MODAL_TYPES } from "@/infrastructure/config/modalTypes";

export function useModalSheet() {
  const { openSheet } = useBottomSheet();

  const showCreateProject = (props?: unknown) => {
    openSheet({
      type: MODAL_TYPES.CREATE_PROJECT,
      props,
    });
  };

  const showInviteUser = (props?: unknown) => {
    openSheet({
      type: MODAL_TYPES.INVITE_USER,
      props,
    });
  };

  return {
    showCreateProject,
    showInviteUser,
  };
}
