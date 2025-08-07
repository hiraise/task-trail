import { useBottomSheet } from "@/app/_components/BottomSheetContext";
import { MODAL_TYPES } from "@/infrastructure/config/modalTypes";

interface InviteUserModalProps {
  onSubmit?: (selectedParticipants: unknown[]) => void | Promise<void>;
}

export function useModalSheet() {
  const { openSheet } = useBottomSheet();

  const showCreateProject = (props?: unknown) => {
    openSheet({
      type: MODAL_TYPES.CREATE_PROJECT,
      props,
    });
  };

  const showCreateTask = (props?: unknown) => {
    openSheet({
      type: MODAL_TYPES.CREATE_TASK,
      props,
    });
  };

  const showInviteUser = (props?: InviteUserModalProps) => {
    openSheet({
      type: MODAL_TYPES.INVITE_USER,
      props,
    });
  };

  const showSortOptions = (props?: unknown) => {
    openSheet({
      type: MODAL_TYPES.SORT_PROJECTS,
      props,
    });
  };

  const showSortTaksOptions = (props?: unknown) => {
    openSheet({
      type: MODAL_TYPES.SORT_TASKS,
      props,
    });
  };

  return {
    showCreateProject,
    showInviteUser,
    showSortOptions,
    showSortTaksOptions,
    showCreateTask,
  };
}
