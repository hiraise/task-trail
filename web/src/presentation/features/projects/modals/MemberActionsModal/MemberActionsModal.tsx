import { ActionsMenu, BaseModal, type BaseModalProps } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { MemberActionsProps } from "@/presentation/shared/hooks/useGlobalModals";

import { useMembersMenuItems } from "../../hooks";

export function MemberActionsModal(props: BaseModalProps<void>) {
  const { member, projectId } = useGlobalModalProps<MemberActionsProps>() ?? {};

  if (!member || !projectId) return null;

  return <MemberActions {...props} member={member} projectId={projectId} />;
}

function MemberActions({ member, projectId, ...props }: BaseModalProps<void> & MemberActionsProps) {
  const { menuItems } = useMembersMenuItems(member, projectId);

  if (menuItems.length === 0) return null;

  return (
    <BaseModal {...props} title="">
      <ActionsMenu items={menuItems} onClose={() => props.onClose()} />
    </BaseModal>
  );
}
