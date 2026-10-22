import { BaseModal, type BaseModalProps } from "@/presentation/shared";
import { tasksTexts } from "@/shared/locales/tasks";

import { CreateTaskForm } from "../../components/CreateTaskForm";

export function CreateTaskModal(props: BaseModalProps) {
  return (
    <BaseModal {...props} title={tasksTexts.newTask}>
      <CreateTaskForm onSubmit={() => props.onClose()} />
    </BaseModal>
  );
}
