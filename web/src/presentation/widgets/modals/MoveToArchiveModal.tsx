import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { ActionProps } from "@/shared/hooks/useGlobalModals";
import { MoveToArchive } from "../common/Actions";
import { DialogButtons } from "../common/DialogButtons";

export default function MoveToArchiveModal(props: BaseModalProps<number>) {
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
