import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./modal.types";
import { CreateProjectForm } from "@/presentation/widgets/projects/CreateProjectForm";
import { CreateProjectFormData } from "@/application/projects/types";
import { useProjectCreation } from "@/application/projects/context/ProjectCreationContext";
import { useProjects } from "@/application/projects/hooks/useProjects";

export default function CreateProjectModal(props: BaseModalProps) {
  const { isOpen, onClose, onBack } = props;
  const { reset } = useProjectCreation();
  const { createProject } = useProjects();

  const handleSubmit = async (data: CreateProjectFormData) => {
    await createProject(data);
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
