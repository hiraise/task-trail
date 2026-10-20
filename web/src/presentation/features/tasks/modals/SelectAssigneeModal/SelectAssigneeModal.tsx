"use client";

import { useState } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DeviceBased, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps, useProjectMembers } from "@/presentation/shared/hooks";
import type { SelectAssigneeProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { MembersListDesktop, MembersListMobile } from "../../components/MembersList";

export default function SelectAssigneeModal(props: BaseModalProps<ProjectMember>) {
  const { projectId, userId } = useGlobalModalProps<SelectAssigneeProps>() ?? {};

  const { data: members = [] } = useProjectMembers(projectId!);
  const currentUser = members.find((user) => user.id === userId);
  const [selectedUser, setSelectedUser] = useState<ProjectMember | undefined>(currentUser);

  const handleMobileSelect = (value: ProjectMember) => {
    setSelectedUser(value);
    props.onClose(value);
  };

  const handleOnSelect = (user: ProjectMember) => {
    setSelectedUser(user);
  };

  const handleApply = () => {
    props.onClose(selectedUser);
  };

  return (
    <BaseModal {...props} fullScreen title={TEXTS.tasks.assignee}>
      <DeviceBased
        desktop={
          <>
            <MembersListDesktop
              selectedUserId={selectedUser?.id}
              members={members}
              onSelect={handleOnSelect}
            />
            <DialogButtons onApply={handleApply} onClose={() => props.onClose()} />
          </>
        }
        mobile={
          <MembersListMobile
            selectedUserId={userId}
            members={members}
            onSelect={handleMobileSelect}
          />
        }
      />
    </BaseModal>
  );
}
