import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DeviceBased, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { LeaveProjectProps } from "@/presentation/shared/hooks/useGlobalModals";

import { LeaveProject } from "../../components";

export function LeaveProjectModal(props: BaseModalProps<number>) {
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
