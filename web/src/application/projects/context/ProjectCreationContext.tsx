import React, { createContext, useContext, useState, ReactNode } from "react";
import { ProjectParticipant } from "../types";

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
        return prev;
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
      return exists
        ? prev.filter((p) => p.email !== participant.email)
        : [...prev, participant];
    });
  };

  const reset = () => {
    setSelectedParticipants([]);
    setSearchQuery("");
  };

  return (
    <ProjectCreationContext
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
    </ProjectCreationContext>
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
