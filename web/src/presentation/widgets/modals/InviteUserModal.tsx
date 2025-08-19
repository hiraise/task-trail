import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { AddParticipantForm } from "@/presentation/widgets/projects/AddParticipantForm";

export default function InviteUserModal({ ...props }: BaseModalProps<string[]>) {
  const handleClose = (emails: string[]) => {
    props.onClose?.(emails);
  };

  return (
    <BaseModal fullScreen={true} title="Добавить участников" {...props}>
      <AddParticipantForm onSubmit={handleClose} />
    </BaseModal>
  );
}
