import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { AddParticipantForm } from "@/presentation/widgets/projects/AddParticipantForm";

interface InviteUserModalProps extends BaseModalProps {
  onSubmit?: (selectedParticipants: unknown[]) => void | Promise<void>;
}

export default function InviteUserModal({ onSubmit, ...props }: InviteUserModalProps) {
  const { isOpen, onClose, onBack } = props;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      fullScreen={true}
      title="Добавить участников"
    >
      <AddParticipantForm onSubmit={onSubmit} />
    </BaseModal>
  );
}
