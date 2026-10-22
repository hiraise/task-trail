import { useState } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DialogButtons } from "@/presentation/shared";
import { useDevice, useGlobalModalProps, useProjectMembers } from "@/presentation/shared/hooks";
import type { SelectAssigneeProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { AssigneeList } from "../../components";

/** Ответственный — из участников проекта задачи; на телефоне окно закрывается выбором. */
export function SelectAssigneeModal(props: BaseModalProps<ProjectMember>) {
  const { onClose, ...rest } = props;
  const { projectId, userId } = useGlobalModalProps<SelectAssigneeProps>() ?? {};
  const { data: members, isLoading } = useProjectMembers(projectId ?? "");
  const [selectedId, setSelectedId] = useState(userId);
  const isPhone = useDevice() === "mobile";

  const handleSelect = (member: ProjectMember) => {
    setSelectedId(member.id);
    if (isPhone) onClose(member);
  };

  const handleApply = () => onClose(members?.find((member) => member.id === selectedId));

  return (
    <BaseModal {...rest} onClose={() => onClose()} fullScreen title={TEXTS.tasks.assignee}>
      <AssigneeList
        members={projectId ? members : undefined}
        isLoading={Boolean(projectId) && isLoading}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
      {!isPhone && <DialogButtons onClose={() => onClose()} onApply={handleApply} />}
    </BaseModal>
  );
}
