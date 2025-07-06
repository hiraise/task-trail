import { useModal } from "@/shared/hooks/useModal";
import {
  useProjectCreation,
  ProjectParticipant,
} from "../context/ProjectCreationContext";

interface UseCreateProjectFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    participants: string[];
  }) => void | Promise<void>;
}

interface UseCreateProjectFormReturn {
  // Project state
  selectedParticipants: ProjectParticipant[];
  searchQuery: string;

  // Actions
  handleRemoveParticipant: (email: string) => void;
  handleAddParticipant: (participant: ProjectParticipant) => void;
  handleToggleParticipant: (participant: ProjectParticipant) => void;
  handleOpenInviteUser: () => void;
  setSearchQuery: (query: string) => void;
  submitProject: (formData: {
    name: string;
    description: string;
  }) => Promise<void>;
  reset: () => void;
}

export function useCreateProjectForm({
  onSubmit,
}: UseCreateProjectFormProps): UseCreateProjectFormReturn {
  const context = useProjectCreation();
  const {
    selectedParticipants,
    searchQuery,
    removeParticipant,
    addParticipant,
    toggleParticipant,
    setSearchQuery,
    reset,
  } = context;
  const modal = useModal();

  const handleRemoveParticipant = (email: string) => {
    removeParticipant(email);
  };

  const handleAddParticipant = (participant: ProjectParticipant) => {
    addParticipant(participant);
  };

  const handleToggleParticipant = (participant: ProjectParticipant) => {
    toggleParticipant(participant);
  };

  const handleOpenInviteUser = () => {
    modal.showInviteUser();
  };

  const submitProject = async (formData: {
    name: string;
    description: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

    // Combine form data with participants from context
    const finalData = {
      ...formData,
      participants: selectedParticipants.map((p) => p.email),
    };

    console.log("Form submitted with data:", finalData);

    try {
      await onSubmit(finalData);
      reset(); // Reset context state after successful submission
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return {
    // Project state
    selectedParticipants,
    searchQuery,

    // Actions
    handleRemoveParticipant,
    handleAddParticipant,
    handleToggleParticipant,
    handleOpenInviteUser,
    setSearchQuery,
    submitProject,
    reset,
  };
}
