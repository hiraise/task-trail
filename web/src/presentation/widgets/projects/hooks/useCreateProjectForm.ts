import { useModal } from "@/shared/hooks/useModal";
import {
  useProjectCreation,
  ProjectParticipant,
} from "../context/ProjectCreationContext";
import { CreateProjectFormData } from "../CreateProjectForm/CreateProjectForm.types";

interface UseCreateProjectFormProps {
  onSubmit: (data: CreateProjectFormData) => void | Promise<void>;
}

interface UseCreateProjectFormReturn {
  // Project state
  projectName: string;
  projectDescription: string;
  selectedParticipants: ProjectParticipant[];

  // Actions
  handleRemoveParticipant: (email: string) => void;
  handleOpenInviteUser: () => void;
  setProjectName: (name: string) => void;
  setProjectDescription: (description: string) => void;
  submitProject: (data: CreateProjectFormData) => Promise<void>;
}

export function useCreateProjectForm({
  onSubmit,
}: UseCreateProjectFormProps): UseCreateProjectFormReturn {
  const { state, actions } = useProjectCreation();
  const { projectName, projectDescription, selectedParticipants } = state;
  const modal = useModal();

  const handleRemoveParticipant = (email: string) => {
    actions.removeParticipant(email);
  };

  const handleOpenInviteUser = () => {
    modal.showInviteUser();
  };

  const setProjectName = (name: string) => {
    actions.setProjectName(name);
  };

  const setProjectDescription = (description: string) => {
    actions.setProjectDescription(description);
  };

  const submitProject = async (data: CreateProjectFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
    console.log("Form submitted with data:", data);

    const finalData = actions.getFormData();

    try {
      await onSubmit(finalData);
      actions.reset(); // Reset state after successful submission
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return {
    // Project state
    projectName,
    projectDescription,
    selectedParticipants,

    // Actions
    handleRemoveParticipant,
    handleOpenInviteUser,
    setProjectName,
    setProjectDescription,
    submitProject,
  };
}
