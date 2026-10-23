import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";
import { boardsTexts } from "@/shared/locales/boards";

import { CreateBoardForm } from "../components/CreateBoardForm";

export function CreateBoardModal(props: BaseModalProps) {
  return (
    <BaseModal {...props} title={boardsTexts.newBoard}>
      <CreateBoardForm onSubmit={() => props.onClose()} />
    </BaseModal>
  );
}
