import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { ActionProps } from "@/shared/hooks/useGlobalModals";
import { DeleteItem } from "../common/Actions";
import { DialogButtons } from "../common/DialogButtons";

export default function DeleteItemModal(props: BaseModalProps<number>) {
  const { type, id, title } = useGlobalModalProps<ActionProps>() ?? {};

  if (!type || !title) return;

  const handleClose = () => props.onClose();

  // return item ID for deleting to parent component
  const handleDelete = () => {
    if (id) props.onClose(id);
  };

  return (
    <BaseModal {...props} title="">
      <DeviceBased
        desktop={
          <div style={{ gap: "16px" }}>
            <DeleteItem type={type} name={title} />
            <DialogButtons variant="delete" onClose={handleClose} onDelete={handleDelete} />
          </div>
        }
        mobile={
          <div style={{ gap: "24px" }}>
            <DeleteItem type={type} name={title} />
            <DialogButtons variant="delete" onClose={handleClose} onDelete={handleDelete} />
          </div>
        }
      />
    </BaseModal>
  );
}
