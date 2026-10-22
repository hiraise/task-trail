import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { InviteUserProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { AddParticipantForm } from "../../components";

/** Picks whom to invite to the project; returns the selected emails, the opener does the inviting. */
export function InviteUserModal(props: BaseModalProps<string[]>) {
  const { projectId, emails } = useGlobalModalProps<InviteUserProps>() ?? {};
  const { onClose, ...rest } = props;

  return (
    <BaseModal fullScreen title={TEXTS.projects.addParticipant} onClose={() => onClose()} {...rest}>
      <AddParticipantForm projectId={projectId} initialEmails={emails} onSubmit={onClose} />
    </BaseModal>
  );
}
