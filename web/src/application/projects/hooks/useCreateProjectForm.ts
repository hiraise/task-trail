import { BaseUserData } from "@/presentation/widgets/projects/AddParticipantForm/AddParticipantForm";
import { useProjectCreation } from "../context/ProjectCreationContext";

interface UseCreateProjectFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    participants: string[];
  }) => void | Promise<void>;
}

interface UseCreateProjectFormReturn {
  members: BaseUserData[];
  removeParticipant: (email: string) => void;
  submitProject: (formData: {
    name: string;
    description: string;
  }) => Promise<void>;
}

export function useCreateProjectForm({
  onSubmit,
}: UseCreateProjectFormProps): UseCreateProjectFormReturn {
  const { members, removeParticipant, reset } = useProjectCreation();

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
      participants: members.map((p) => p.email),
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
    members,
    removeParticipant,
    submitProject,
  };
}
