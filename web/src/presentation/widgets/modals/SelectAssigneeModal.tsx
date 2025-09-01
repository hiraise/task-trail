"use client";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { MembersList } from "../tasks/MembersList/MembersList";
import { useGetProjectMembers } from "@/application/projects/hooks/useProject";
import { useParams } from "next/navigation";
import { MembersData } from "@/domain/user/user.entity";

export default function SelectAssigneeModal(props: BaseModalProps<MembersData>) {
  const params = useParams();
  const projectId = Number(params.id);
  const { data: members = [] } = useGetProjectMembers(projectId);

  const handleOnSelect = (user: MembersData) => {
    props.onClose(user);
    console.log("Assignee selected:", user.username);
  };

  return (
    <BaseModal {...props} fullScreen showBackButton title="Ответственный">
      <MembersList members={members} onSelect={handleOnSelect} />
    </BaseModal>
  );
}
