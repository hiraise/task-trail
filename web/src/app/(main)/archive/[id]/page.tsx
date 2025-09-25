"use client";

import "./styles.css";

import { BackButton } from "@/presentation/ui/BackButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { TaskInfo } from "@/presentation/widgets/tasks/TaskInfo";
import { Comments } from "@/presentation/widgets/tasks/Comments";
import { useGetTask } from "@/application/tasks/hooks/useTasks";

export default function TaskPage() {
  const { data: task } = useGetTask();

  if (!task) return null;

  return (
    <>
      <MainContainer>
        <DashboardHeader />
        <div className="container">
          <BackButton />
        </div>
        <div className="content">
          <TaskInfo task={task} />
          <Comments />
        </div>
      </MainContainer>
    </>
  );
}
