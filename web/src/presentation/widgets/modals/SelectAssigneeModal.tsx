import { MembersData, users } from "../projects/MembersList/MembersList.mock";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { MembersList } from "../tasks/MembersList/MembersList";

export default function SelectAssigneeModal(props: BaseModalProps<MembersData>) {
  const handleOnSelect = (user: MembersData) => {
    props.onClose(user);
    console.log("Assignee selected:", user.username);
  };

  return (
    <BaseModal {...props} fullScreen={true} title="Ответственный">
      <MembersList members={users} onSelect={handleOnSelect} />
    </BaseModal>
  );
}
