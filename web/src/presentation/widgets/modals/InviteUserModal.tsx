import { InviteUserModalProps } from "./modal.types";
import { BaseModal } from "./BaseModal";
import { AddParticipantForm } from "../projects/AddParticipantForm/AddParticipantForm";

export default function InviteUserModal({ ...props }: InviteUserModalProps) {
  const { ...baseProps } = props;

  //TODO: Move text to a separate file
  return (
    <BaseModal fullScreen={true} {...baseProps} title="Добавить участников">
      <AddParticipantForm />
    </BaseModal>
  );
}
