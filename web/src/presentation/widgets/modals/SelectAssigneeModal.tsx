"use client";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { MembersList } from "../tasks/MembersList/MembersList";
import { useGetProjectMembers } from "@/application/projects/hooks/useProject";
import { MembersData } from "@/domain/user/user.entity";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { SelectAssigneeProps } from "@/shared/hooks/useGlobalModals";

export default function SelectAssigneeModal(props: BaseModalProps<MembersData>) {
  const { projectId, userId } = useGlobalModalProps<SelectAssigneeProps>() ?? {};

  const { data: members = [] } = useGetProjectMembers(projectId!);

  const handleOnSelect = (user: MembersData) => {
    props.onClose(user);
    console.log("Assignee selected:", user.username);
  };

  return (
    <BaseModal {...props} fullScreen title="Ответственный">
      <MembersList selectedUserId={userId} members={members} onSelect={handleOnSelect} />
    </BaseModal>
  );
}
