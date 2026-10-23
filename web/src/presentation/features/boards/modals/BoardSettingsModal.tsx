import type { BoardId } from "@/domain/types";
import { ActionsMenu, BaseModal, type BaseModalProps } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";

import { useBoard, useBoardMenuItems } from "../hooks";

/** The board menu in a phone bottom sheet (frame 843:91329). */
export function BoardSettingsModal(props: BaseModalProps<void>) {
  const { boardId = "" } = useGlobalModalProps<{ boardId?: BoardId }>() ?? {};
  const { data: board } = useBoard(boardId);
  const { menuItems } = useBoardMenuItems(board);

  return (
    <BaseModal {...props} title="">
      <ActionsMenu items={menuItems} onClose={() => props.onClose()} />
    </BaseModal>
  );
}
