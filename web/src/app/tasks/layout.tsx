import { NexTaskProvider } from "./NexTaskContext";
import { TaskModalProvider } from "./TaskModalContext";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <TaskModalProvider>
      <NexTaskProvider>{children}</NexTaskProvider>
    </TaskModalProvider>
  );
}
