"use client";

import { useState } from "react";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { useGetProjectMembers } from "@/application/projects/hooks/useProject";
import { MembersData } from "@/domain/user/user.entity";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { SelectAssigneeProps } from "@/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { MembersListDesktop, MembersListMobile } from "../widgets/tasks/MembersList";
import { DialogButtons } from "../widgets/common/DialogButtons";

export default function SelectAssigneeModal(props: BaseModalProps<MembersData>) {
  const { projectId, userId } = useGlobalModalProps<SelectAssigneeProps>() ?? {};

  const { data: members = [] } = useGetProjectMembers(projectId!);
  const currentUser = members.find((user) => user.id === userId);
  const [selectedUser, setSelectedUser] = useState<MembersData | undefined>(currentUser);

  const handleMobileSelect = (value: MembersData) => {
    setSelectedUser(value);
    props.onClose(value);
  };

  const handleOnSelect = (user: MembersData) => {
    setSelectedUser(user);
    console.log("Assignee selected:", user.username);
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
