import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { LeaveProjectProps } from "@/shared/hooks/useGlobalModals";
import { DialogButtons } from "../common/DialogButtons";
import { LeaveProject } from "../projects/LeaveProject";

export default function LeaveProjectModal(props: BaseModalProps<number>) {
  const { id, title } = useGlobalModalProps<LeaveProjectProps>() ?? {};

  if (!title) return;

  const handleClose = () => props.onClose();

  // return item ID for leaving to parent component
  const handleLeave = () => {
    if (id) props.onClose(id);
  };

  return (
    <BaseModal {...props} title="">
      <DeviceBased
        desktop={
          <div style={{ gap: "16px" }}>
            <LeaveProject name={title} />
            <DialogButtons variant="leave" onClose={handleClose} onLeave={handleLeave} />
          </div>
        }
        mobile={
          <div style={{ gap: "24px" }}>
            <LeaveProject name={title} />
            <DialogButtons variant="leave" onClose={handleClose} onLeave={handleLeave} />
          </div>
        }
      />
    </BaseModal>
  );
}
