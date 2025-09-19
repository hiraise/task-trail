import styles from "./DesktopModal.module.css";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { TaskActionProps } from "@/shared/hooks/useGlobalModals";
import { DeleteTask } from "../tasks/TaskActions";
import { DialogButtons } from "../common/DialogButtons";

export default function DeleteTaskModal(props: BaseModalProps<string>) {
  const { id, title } = useGlobalModalProps<TaskActionProps>() ?? {};

  const handleClose = () => props.onClose();

  const handleDelete = () => {
    console.log("Delete task with ID: ", id);
    props.onClose();
  };

  return (
    <BaseModal {...props} title="">
      <DeviceBased
        desktop={
          <div className={styles.desktop} style={{ gap: "16px" }}>
            <DeleteTask taskName={title} />
            <DialogButtons variant="delete" onClose={handleClose} onDelete={handleDelete} />
          </div>
        }
        mobile={
          <div className={styles.mobile} style={{ gap: "24px" }}>
            <DeleteTask taskName={title} />
            <DialogButtons variant="delete" onClose={handleClose} onDelete={handleDelete} />
          </div>
        }
      />
    </BaseModal>
  );
}
