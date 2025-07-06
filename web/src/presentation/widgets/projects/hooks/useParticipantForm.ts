import {
  useProjectCreation,
  ProjectParticipant,
} from "../context/ProjectCreationContext";

interface UseParticipantFormReturn {
  // Participants
  selectedParticipants: ProjectParticipant[];
  searchQuery: string;

  // Actions
  handleUserSelect: (user: ProjectParticipant) => void;
  handleDeleteUser: (user: ProjectParticipant) => void;
  setSearchQuery: (query: string) => void;
  submitParticipant: (email: string) => void;
}

export function useParticipantForm(): UseParticipantFormReturn {
  const { state, actions } = useProjectCreation();
  const { searchQuery, selectedParticipants } = state;

  const handleDeleteUser = (user: ProjectParticipant) => {
    actions.removeParticipant(user.email);
  };

  const handleUserSelect = (user: ProjectParticipant) => {
    actions.toggleParticipant(user);
  };

  const setSearchQuery = (query: string) => {
    actions.setSearchQuery(query);
  };

  const submitParticipant = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      const newParticipant: ProjectParticipant = { email };
      actions.addParticipant(newParticipant);
      actions.setSearchQuery(""); // Clear search after adding
    }
  };

  return {
    // Participants
    selectedParticipants,
    searchQuery,

    // Actions
    handleUserSelect,
    handleDeleteUser,
    setSearchQuery,
    submitParticipant,
  };
}
