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
  const context = useProjectCreation();
  const {
    searchQuery,
    selectedParticipants,
    removeParticipant,
    toggleParticipant,
    addParticipant,
    setSearchQuery,
  } = context;

  const handleDeleteUser = (user: ProjectParticipant) => {
    removeParticipant(user.email);
  };

  const handleUserSelect = (user: ProjectParticipant) => {
    toggleParticipant(user);
  };

  const submitParticipant = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();

    if (emailRegex.test(trimmedEmail)) {
      const newParticipant: ProjectParticipant = { email: trimmedEmail };
      addParticipant(newParticipant);
      setSearchQuery(""); // Clear search after adding
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
