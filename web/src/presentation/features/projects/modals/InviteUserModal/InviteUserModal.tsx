import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import { AddParticipantForm } from "../../components";

export function InviteUserModal({ ...props }: BaseModalProps<string[]>) {
  const { onClose, ...rest } = props;

  const handleClose = () => onClose([]);
  const handleSubmit = (emails: string[]) => onClose(emails);

  return (
    <BaseModal fullScreen title={TEXTS.projects.addParticipant} onClose={handleClose} {...rest}>
      <AddParticipantForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
