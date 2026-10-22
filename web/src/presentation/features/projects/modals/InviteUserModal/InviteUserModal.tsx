import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { InviteUserProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { AddParticipantForm } from "../../components";

/** Выбор, кого позвать в проект; возвращает выбранные почты, звать — тому, кто открыл. */
export function InviteUserModal(props: BaseModalProps<string[]>) {
  const { projectId, emails } = useGlobalModalProps<InviteUserProps>() ?? {};
  const { onClose, ...rest } = props;

  return (
    <BaseModal fullScreen title={TEXTS.projects.addParticipant} onClose={() => onClose()} {...rest}>
      <AddParticipantForm projectId={projectId} initialEmails={emails} onSubmit={onClose} />
    </BaseModal>
  );
}
