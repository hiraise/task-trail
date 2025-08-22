"use client";

import { MembersData } from "../projects/MembersList/MembersList.mock";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { MembersList } from "../tasks/MembersList/MembersList";
import { useAppSelector } from "@/infrastructure/redux/hooks";

export default function SelectAssigneeModal(props: BaseModalProps<MembersData>) {
  const members = useAppSelector((s) => s.project.members);

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
