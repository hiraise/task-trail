import { TEXTS } from "@/shared/locales/texts";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { AddParticipantForm } from "@/presentation/widgets/projects/AddParticipantForm";

export default function InviteUserModal({ ...props }: BaseModalProps<string[]>) {
  const { onClose, ...rest } = props;

  const handleClose = () => onClose([]);
  const handleSubmit = (emails: string[]) => onClose(emails);

  return (
    <BaseModal fullScreen title={TEXTS.projects.addParticipant} onClose={handleClose} {...rest}>
      <AddParticipantForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
