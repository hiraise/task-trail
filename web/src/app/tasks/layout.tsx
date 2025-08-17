import { TaskModalProvider } from "./TaskModalContext";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <TaskModalProvider>{children}</TaskModalProvider>;
}
