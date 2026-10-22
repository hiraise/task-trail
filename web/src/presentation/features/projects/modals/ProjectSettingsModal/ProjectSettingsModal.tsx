import type { ProjectId } from "@/domain/types";
import { BaseModal, type BaseModalProps } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";

import { ActionsMenu } from "../../components/ActionsMenu";
import { useProjectMenuItems } from "../../hooks";

export function ProjectSettingsModal(props: BaseModalProps<void>) {
  const { projectId = "" } = useGlobalModalProps<{ projectId?: ProjectId }>() ?? {};
  const { menuItems } = useProjectMenuItems(projectId);

  return (
    <BaseModal {...props} title="">
      <ActionsMenu items={menuItems} onClose={() => props.onClose()} />
    </BaseModal>
  );
}
