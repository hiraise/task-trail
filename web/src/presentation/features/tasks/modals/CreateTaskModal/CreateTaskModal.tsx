import { BaseModal, type BaseModalProps } from "@/presentation/shared";

import { CreateTaskForm } from "../../components/CreateTaskForm";

export default function CreateTaskModal(props: BaseModalProps) {
  const handleSubmit = () => props.onClose();

  return (
    <BaseModal {...props} title="Новая задача">
      <CreateTaskForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
