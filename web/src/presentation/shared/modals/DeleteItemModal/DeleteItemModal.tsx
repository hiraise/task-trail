import { DeleteItem, DeviceBased, DialogButtons } from "../../components";
import { useGlobalModalProps, useGlobalModals } from "../../hooks";
import type { ActionProps } from "../../hooks/useGlobalModals";
import { BaseModal, type BaseModalProps } from "../BaseModal";

export default function DeleteItemModal(props: BaseModalProps<number>) {
  const { type, id, title } = useGlobalModalProps<ActionProps>() ?? {};
  const { closeAllModals } = useGlobalModals();

  if (!type || !title) return;

  const handleClose = () => props.onClose();

  // return item ID for deleting to parent component
  const handleDelete = () => {
    if (id) {
      props.onClose(id);
      closeAllModals();
    }
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
