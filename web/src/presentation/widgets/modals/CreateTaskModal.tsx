import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { CreateTaskForm } from "../projects/CreateTaskForm";

export default function CreateTaskModal(props: BaseModalProps) {
  const handleSubmit = async () => {
    console.log("Create task submitted");
    props.onClose();
  };

  return (
    <BaseModal {...props} title="Новая задача">
      <CreateTaskForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
