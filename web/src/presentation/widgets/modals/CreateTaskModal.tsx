import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { CreateTaskForm } from "../projects/CreateTaskForm";

export default function CreateTaskModal(props: BaseModalProps) {
  const { isOpen, onClose, onBack } = props;

  const handleSubmit = async () => {
    console.log("Task submitted");
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} onBack={onBack}>
      <CreateTaskForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
