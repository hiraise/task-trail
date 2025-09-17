"use client";

import styles from "./TaskMobilePage.module.css";

import { useGetTask } from "@/application/tasks/hooks/useTasks";
import { BackButton } from "@/presentation/ui/BackButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { Comments } from "@/presentation/widgets/tasks/Comments";
import { TaskInfo } from "@/presentation/widgets/tasks/TaskInfo";

export function TaskMobilePage() {
  const { data: task } = useGetTask();

  if (!task) return null;

  return (
    <MainContainer>
      <DashboardHeader />
      <div className={styles.container}>
        <BackButton />
      </div>
      <div className={styles.content}>
        <TaskInfo task={task} />
        <Comments />
      </div>
    </MainContainer>
  );
}
