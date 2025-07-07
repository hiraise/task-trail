import { useProjectCreation } from "../context/ProjectCreationContext";
import { ProjectParticipant } from "../types";

interface UseCreateProjectFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    participants: string[];
  }) => void | Promise<void>;
}

interface UseCreateProjectFormReturn {
  selectedParticipants: ProjectParticipant[];
  removeParticipant: (email: string) => void;
  submitProject: (formData: {
    name: string;
    description: string;
  }) => Promise<void>;
}

export function useCreateProjectForm({
  onSubmit,
}: UseCreateProjectFormProps): UseCreateProjectFormReturn {
  const { selectedParticipants, removeParticipant, reset } =
    useProjectCreation();

  const submitProject = async (formData: {
    name: string;
    description: string;
  }) => {
    // TODO: Remove simulation in production
    if (process.env.NODE_ENV === "development") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const finalData = {
      ...formData,
      participants: selectedParticipants.map((p) => p.email),
    };

    console.log("Form submitted with data:", finalData);

    try {
      await onSubmit(finalData);
      reset();
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error; // Re-throw for form to handle
    }
  };

  return {
    selectedParticipants,
    removeParticipant,
    submitProject,
  };
}
