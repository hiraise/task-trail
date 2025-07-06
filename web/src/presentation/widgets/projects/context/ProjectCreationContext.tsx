import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ProjectParticipant {
  id?: string;
  username?: string;
  email: string;
  avatarUrl?: string;
}

interface ProjectCreationContextType {
  selectedParticipants: ProjectParticipant[];
  searchQuery: string;
  addParticipant: (participant: ProjectParticipant) => void;
  removeParticipant: (email: string) => void;
  toggleParticipant: (participant: ProjectParticipant) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const ProjectCreationContext = createContext<ProjectCreationContextType | null>(
  null
);

export function ProjectCreationProvider({ children }: { children: ReactNode }) {
  const [selectedParticipants, setSelectedParticipants] = useState<
    ProjectParticipant[]
  >([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const addParticipant = (participant: ProjectParticipant) => {
    setSelectedParticipants((prev) => {
      if (prev.some((p) => p.email === participant.email)) {
        return prev; // Already exists
      }
      return [...prev, participant];
    });
  };

  const removeParticipant = (email: string) => {
    setSelectedParticipants((prev) => prev.filter((p) => p.email !== email));
  };

  const toggleParticipant = (participant: ProjectParticipant) => {
    setSelectedParticipants((prev) => {
      const exists = prev.some((p) => p.email === participant.email);
      if (exists) {
        return prev.filter((p) => p.email !== participant.email);
      }
      return [...prev, participant];
    });
  };

  const reset = () => {
    setSelectedParticipants([]);
    setSearchQuery("");
  };

  return (
    <ProjectCreationContext.Provider
      value={{
        selectedParticipants,
        searchQuery,
        addParticipant,
        removeParticipant,
        toggleParticipant,
        setSearchQuery,
        reset,
      }}
    >
      {children}
    </ProjectCreationContext.Provider>
  );
}

export function useProjectCreation() {
  const context = useContext(ProjectCreationContext);
  if (!context) {
    throw new Error(
      "useProjectCreation must be used within ProjectCreationProvider"
    );
  }
  return context;
}
