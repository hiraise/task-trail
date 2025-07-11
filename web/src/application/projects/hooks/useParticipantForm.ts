import { BaseUserData } from "@/presentation/widgets/projects/AddParticipantForm/AddParticipantForm";
import { useProjectCreation } from "../context/ProjectCreationContext";

interface UseParticipantFormReturn {
  selectedParticipants: BaseUserData[];
  searchQuery: string;
  handleUserSelect: (user: BaseUserData) => void;
  handleDeleteUser: (user: BaseUserData) => void;
  setSearchQuery: (query: string) => void;
  inviteMembers: () => void;
}

export function useParticipantForm(): UseParticipantFormReturn {
  const context = useProjectCreation();
  const {
    searchQuery,
    selectedParticipants,
    inviteMembers,
    removeParticipant,
    toggleParticipant,
    setSearchQuery,
  } = context;

  const handleDeleteUser = (user: BaseUserData) => {
    removeParticipant(user.email);
  };

  const handleUserSelect = (user: BaseUserData) => {
    toggleParticipant(user);
  };

  return {
    selectedParticipants,
    searchQuery,
    handleUserSelect,
    handleDeleteUser,
    setSearchQuery,
    inviteMembers,
  };
}
