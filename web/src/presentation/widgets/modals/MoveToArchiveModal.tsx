import styles from "./DesktopModal.module.css";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { TaskActionProps } from "@/shared/hooks/useGlobalModals";
import { MoveToArchive } from "../tasks/TaskActions";
import { DialogButtons } from "../common/DialogButtons";

export default function MoveToArchiveModal(props: BaseModalProps<string>) {
  const { id, title } = useGlobalModalProps<TaskActionProps>() ?? {};

  const handleClose = () => props.onClose();

  const handleMove = () => {
    console.log("Move task with ID: ", id);
    props.onClose();
  };

  return (
    <BaseModal {...props} title="">
      <DeviceBased
        desktop={
          <div className={styles.desktop} style={{ gap: "16px" }}>
            <MoveToArchive taskName={title} />
            <DialogButtons variant="move" onClose={handleClose} onMove={handleMove} />
          </div>
        }
        mobile={
          <div className={styles.mobile} style={{ gap: "24px" }}>
            <MoveToArchive taskName={title} />
            <DialogButtons variant="move" onClose={handleClose} onMove={handleMove} />
          </div>
        }
      />
    </BaseModal>
  );
}
