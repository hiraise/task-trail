import { BaseModal } from "./BaseModal";
import { CreateProjectModalProps } from "./modal.types";
import { CreateProjectForm } from "../projects/CreateProjectForm";
import { CreateProjectFormData } from "../projects/CreateProjectForm/CreateProjectForm.types";

export default function CreateProjectModal(props: CreateProjectModalProps) {
  const { isOpen, onClose, onBack } = props;

  const handleSubmit = (data: CreateProjectFormData) => {
    alert("Project created: " + JSON.stringify(data));
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} onBack={onBack}>
      <CreateProjectForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
