import type { ProjectId } from "@/domain/types";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { LeaveProjectProps } from "@/presentation/shared/hooks/useGlobalModals";

import { LeaveProject } from "../../components";

import styles from "./LeaveProjectModal.module.css";

/** Leave confirmation: returns the ID of the project to leave. */
export function LeaveProjectModal(props: BaseModalProps<ProjectId>) {
  const { id, title } = useGlobalModalProps<LeaveProjectProps>() ?? {};

  if (!id || !title) return null;

  return (
    <BaseModal {...props} title="">
      <div className={styles.content}>
        <LeaveProject name={title} />
        <DialogButtons variant="leave" onClose={() => props.onClose()} onLeave={() => props.onClose(id)} />
      </div>
    </BaseModal>
  );
}
