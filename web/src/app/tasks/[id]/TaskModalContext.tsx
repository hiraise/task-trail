"use client";
import { createContext, useContext, useState } from "react";

interface TaskModalContextProps {
  isStatusModalOpen: boolean;
  openStatusModal: () => void;
  closeStatusModal: () => void;
}

const TaskModalContext = createContext<TaskModalContextProps | null>(null);

export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  return (
    <TaskModalContext
      value={{
        isStatusModalOpen,
        openStatusModal: () => setIsStatusModalOpen(true),
        closeStatusModal: () => setIsStatusModalOpen(false),
      }}
    >
      {children}
    </TaskModalContext>
  );
}

export function useTaskModal() {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error("useTaskModal must be used within TaskModalProvider");
  }
  return context;
}
