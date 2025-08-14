import { useProjectCreation } from "../context/ProjectCreationContext";
import { useProjects } from "./useProjects";
import { ProjectPayload } from "@/domain/project/project.payload";
import { BaseUserData } from "@/presentation/widgets/projects/AddParticipantForm/AddParticipantForm";

interface UseCreateProjectFormReturn {
  members: BaseUserData[];
  removeParticipant: (email: string) => void;
  submitProject: (formData: ProjectPayload) => Promise<void>;
}

export function useCreateProjectForm(): UseCreateProjectFormReturn {
  const { members, removeParticipant, reset } = useProjectCreation();
  const { create } = useProjects();

  const submitProject = async (formData: ProjectPayload) => {
    const data = {
      ...formData,
      participants: members.map((p) => p.email),
    };
    await create(data);
    reset();
  };

  return {
    members,
    removeParticipant,
    submitProject,
  };
}
