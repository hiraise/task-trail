import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./modal.types";
import { AddParticipantForm } from "@/presentation/widgets/projects/AddParticipantForm/AddParticipantForm";

export default function InviteUserModal(props: BaseModalProps) {
  const { isOpen, onClose, onBack } = props;
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      fullScreen={true}
      title="Добавить участников"
    >
      <AddParticipantForm />
    </BaseModal>
  );
}
