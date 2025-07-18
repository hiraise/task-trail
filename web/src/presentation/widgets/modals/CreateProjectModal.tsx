import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./modal.types";
import { CreateProjectForm } from "@/presentation/widgets/projects/CreateProjectForm";
import { useProjectCreation } from "@/application/projects/context/ProjectCreationContext";

export default function CreateProjectModal(props: BaseModalProps) {
  const { isOpen, onClose, onBack } = props;
  const { reset } = useProjectCreation();

  const handleSubmit = () => {
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} onBack={onBack}>
      <CreateProjectForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
