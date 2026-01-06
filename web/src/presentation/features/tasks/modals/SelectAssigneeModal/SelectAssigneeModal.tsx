"use client";

import { useState } from "react";

import type { ProjectMemberResponseDto } from "@/application/dto/ProjectMemberResponseDto";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DeviceBased, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps, useProjectMembers } from "@/presentation/shared/hooks";
import type { SelectAssigneeProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { MembersListDesktop, MembersListMobile } from "../../components/MembersList";

export default function SelectAssigneeModal(props: BaseModalProps<ProjectMemberResponseDto>) {
  const { projectId, userId } = useGlobalModalProps<SelectAssigneeProps>() ?? {};

  const { data: members = [] } = useProjectMembers(projectId!);
  const currentUser = members.find((user) => user.id === userId);
  const [selectedUser, setSelectedUser] = useState<ProjectMemberResponseDto | undefined>(
    currentUser
  );

  const handleMobileSelect = (value: ProjectMemberResponseDto) => {
    setSelectedUser(value);
    props.onClose(value);
  };

  const handleOnSelect = (user: ProjectMemberResponseDto) => {
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
              selectedUserId={Number(selectedUser?.id)}
              members={members}
              onSelect={handleOnSelect}
            />
            <DialogButtons onApply={handleApply} onClose={() => props.onClose()} />
          </>
        }
        mobile={
          <MembersListMobile
            selectedUserId={Number(userId)}
            members={members}
            onSelect={handleMobileSelect}
          />
        }
      />
    </BaseModal>
  );
}
