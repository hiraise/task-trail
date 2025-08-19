"use client";

import "./styles.css";

import { BackButton } from "@/presentation/ui/BackButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { useTask } from "@/application/tasks/hooks/useTask";
import { TaskInfo } from "@/presentation/widgets/tasks/TaskInfo";

function TaskComments() {
  return (
    <div className="task-comments">
      <h1>Комментарии</h1>
    </div>
  );
}

export default function TaskPage() {
  const { task } = useTask();

  if (!task.id) return <h1>Уууупппс....такой задачи не существует</h1>;

  return (
    <>
      <MainContainer>
        <DashboardHeader />
        <div className="container">
          <BackButton />
        </div>
        <div className="content">
          <TaskInfo task={task} />
          <TaskComments />
        </div>
      </MainContainer>
    </>
  );
}
