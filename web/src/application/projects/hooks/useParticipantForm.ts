import { BaseUserData } from "@/presentation/widgets/projects/AddParticipantForm/AddParticipantForm";
import { useProjectCreation } from "../context/ProjectCreationContext";

interface UseParticipantFormReturn {
  selectedParticipants: BaseUserData[];
  handleUserSelect: (user: BaseUserData) => void;
  handleDeleteUser: (user: BaseUserData) => void;
  inviteMembers: () => void;
}

export function useParticipantForm(): UseParticipantFormReturn {
  const context = useProjectCreation();
  const {
    selectedParticipants,
    inviteMembers,
    removeParticipant,
    toggleParticipant,
  } = context;

  const handleDeleteUser = (user: BaseUserData) => {
    removeParticipant(user.email);
  };

  const handleUserSelect = (user: BaseUserData) => {
    toggleParticipant(user);
  };

  return {
    selectedParticipants,
    handleUserSelect,
    handleDeleteUser,
    inviteMembers,
  };
}
