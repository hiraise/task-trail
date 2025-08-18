"use client";

import { createContext, useContext, useState } from "react";

interface NewTaskContextProps {
  name: string;
  description: string;
  assignee: string;
  project: string;
}

const initialContext: NewTaskContextProps = {
  name: "",
  description: "",
  assignee: "",
  project: "",
};

interface NewTaskContextType extends NewTaskContextProps {
  setFields: (fields: Partial<NewTaskContextProps>) => void;
  clearFields: () => void;
  initialValues: NewTaskContextProps;
}

const NexTaskContext = createContext<NewTaskContextType>({
  ...initialContext,
  setFields: () => {},
  clearFields: () => {},
  initialValues: initialContext,
});

export function NexTaskProvider({ children }: { children: React.ReactNode }) {
  const [newTask, setNewTask] = useState<NewTaskContextProps>(initialContext);

  const setFields = (fields: Partial<NewTaskContextProps>) => {
    setNewTask((prev) => ({ ...prev, ...fields }));
  };

  const clearFields = () => {
    setNewTask(initialContext);
  };

  const value = { ...newTask, setFields, clearFields, initialValues: initialContext };
  return <NexTaskContext.Provider value={value}>{children}</NexTaskContext.Provider>;
}

export function useNewTask() {
  const context = useContext(NexTaskContext);
  if (!context) throw new Error("useNewTask must be used within NexTaskProvider");
  return context;
}
