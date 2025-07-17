import React, { createContext, useContext, useState, ReactNode } from "react";

import { BaseUserData } from "@/presentation/widgets/projects/AddParticipantForm/AddParticipantForm";

interface ProjectCreationContextType {
  members: BaseUserData[];
  selectedParticipants: BaseUserData[];
  searchQuery: string;
  inviteMembers: () => void;
  addParticipant: (participant: BaseUserData) => void;
  removeParticipant: (email: string) => void;
  toggleParticipant: (participant: BaseUserData) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const ProjectCreationContext = createContext<ProjectCreationContextType | null>(
  null
);

export function ProjectCreationProvider({ children }: { children: ReactNode }) {
  const [selectedParticipants, setSelectedParticipants] = useState<
    BaseUserData[]
  >([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [members, setMembers] = useState<BaseUserData[]>([]);

  // Function to add members to the project
  const inviteMembers = () => setMembers(selectedParticipants);

  const addParticipant = (participant: BaseUserData) => {
    setSelectedParticipants((prev) => {
      if (prev.some((p) => p.email === participant.email)) {
        return prev;
      }
      return [...prev, participant];
    });
  };

  const removeParticipant = (email: string) => {
    setSelectedParticipants((prev) => prev.filter((p) => p.email !== email));
    setMembers((prev) => prev.filter((p) => p.email !== email));
  };

  const toggleParticipant = (participant: BaseUserData) => {
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
        members,
        selectedParticipants,
        searchQuery,
        inviteMembers,
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
