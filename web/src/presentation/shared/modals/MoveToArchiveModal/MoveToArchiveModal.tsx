import type { ProjectId, TaskId } from "@/domain/types";

import { DeviceBased, DialogButtons, MoveToArchive } from "../../components";
import { useGlobalModalProps } from "../../hooks";
import type { ActionProps } from "../../hooks/useGlobalModals";
import { BaseModal, type BaseModalProps } from "../BaseModal";

export default function MoveToArchiveModal(props: BaseModalProps<TaskId | ProjectId>) {
  const { type, id, title } = useGlobalModalProps<ActionProps>() ?? {};

  if (!type || !title) return;

  const handleClose = () => props.onClose();

  // return item ID for archiving to parent component
  const handleMove = () => {
    if (id) props.onClose(id);
  };

  return (
    <BaseModal {...props} title="">
      <DeviceBased
        desktop={
          <div style={{ gap: "16px" }}>
            <MoveToArchive name={title} type={type} />
            <DialogButtons variant="move" onClose={handleClose} onMove={handleMove} />
          </div>
        }
        mobile={
          <div style={{ gap: "24px" }}>
            <MoveToArchive name={title} type={type} />
            <DialogButtons variant="move" onClose={handleClose} onMove={handleMove} />
          </div>
        }
      />
    </BaseModal>
  );
}
