"use client";

import { useEffect } from "react";

import { TaskModalProvider } from "./TaskModalContext";
import { useTask } from "@/application/tasks/hooks/useTask";
import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { setTask } from "@/application/tasks/slices/taskSlice";
import { mockTasks } from "@/presentation/widgets/tasks/TaskList";

export default function TaskLayout({ children }: { children: React.ReactNode }) {
  const { taskId } = useTask();
  const task = mockTasks.find((task) => task.id === taskId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setTask(task));
  }, [dispatch, task]);

  return <TaskModalProvider>{children}</TaskModalProvider>;
}
