import React, { createContext, useContext, useReducer, ReactNode } from "react";

export interface ProjectParticipant {
  id?: string;
  username?: string;
  email: string;
  avatarUrl?: string;
}

export interface ProjectCreationState {
  projectName: string;
  projectDescription: string;
  selectedParticipants: ProjectParticipant[];
  searchQuery: string;
}

type ProjectCreationAction =
  | { type: "SET_PROJECT_NAME"; payload: string }
  | { type: "SET_PROJECT_DESCRIPTION"; payload: string }
  | { type: "ADD_PARTICIPANT"; payload: ProjectParticipant }
  | { type: "REMOVE_PARTICIPANT"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "RESET" };

const initialState: ProjectCreationState = {
  projectName: "",
  projectDescription: "",
  selectedParticipants: [],
  searchQuery: "",
};

function projectCreationReducer(
  state: ProjectCreationState,
  action: ProjectCreationAction
): ProjectCreationState {
  switch (action.type) {
    case "SET_PROJECT_NAME":
      return { ...state, projectName: action.payload };

    case "SET_PROJECT_DESCRIPTION":
      return { ...state, projectDescription: action.payload };

    case "ADD_PARTICIPANT":
      if (
        state.selectedParticipants.some((p) => p.email === action.payload.email)
      ) {
        return state; // Already exists
      }
      return {
        ...state,
        selectedParticipants: [...state.selectedParticipants, action.payload],
      };

    case "REMOVE_PARTICIPANT":
      return {
        ...state,
        selectedParticipants: state.selectedParticipants.filter(
          (p) => p.email !== action.payload
        ),
      };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

interface ProjectCreationContextType {
  state: ProjectCreationState;
  actions: {
    setProjectName: (name: string) => void;
    setProjectDescription: (description: string) => void;
    addParticipant: (participant: ProjectParticipant) => void;
    removeParticipant: (email: string) => void;
    toggleParticipant: (participant: ProjectParticipant) => void;
    setSearchQuery: (query: string) => void;
    reset: () => void;
    getFormData: () => {
      name: string;
      description: string;
      participants: string[];
    };
  };
}

const ProjectCreationContext = createContext<ProjectCreationContextType | null>(
  null
);

export function ProjectCreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectCreationReducer, initialState);

  const actions = {
    setProjectName: (name: string) =>
      dispatch({ type: "SET_PROJECT_NAME", payload: name }),

    setProjectDescription: (description: string) =>
      dispatch({ type: "SET_PROJECT_DESCRIPTION", payload: description }),

    addParticipant: (participant: ProjectParticipant) =>
      dispatch({ type: "ADD_PARTICIPANT", payload: participant }),

    removeParticipant: (email: string) =>
      dispatch({ type: "REMOVE_PARTICIPANT", payload: email }),

    toggleParticipant: (participant: ProjectParticipant) => {
      if (
        state.selectedParticipants.some((p) => p.email === participant.email)
      ) {
        dispatch({ type: "REMOVE_PARTICIPANT", payload: participant.email });
      } else {
        dispatch({ type: "ADD_PARTICIPANT", payload: participant });
      }
    },

    setSearchQuery: (query: string) =>
      dispatch({ type: "SET_SEARCH_QUERY", payload: query }),

    reset: () => dispatch({ type: "RESET" }),

    getFormData: () => ({
      name: state.projectName,
      description: state.projectDescription,
      participants: state.selectedParticipants.map((p) => p.email),
    }),
  };

  return (
    <ProjectCreationContext.Provider value={{ state, actions }}>
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
