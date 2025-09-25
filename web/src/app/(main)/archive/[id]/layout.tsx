"use client";

import { useGetTask } from "@/application/tasks/hooks/useTasks";

export default function TaskLayout({ children }: { children: React.ReactNode }) {
  const { data: task, isLoading, isError } = useGetTask();

  if (isLoading) return <div>Loading task...</div>;
  if (isError) return <div>Error loading task</div>;
  if (!task) return <div>Task not found</div>;

  return <>{children}</>;
}
