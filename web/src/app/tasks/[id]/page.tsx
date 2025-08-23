"use client";

import "./styles.css";

import { BackButton } from "@/presentation/ui/BackButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { TaskInfo } from "@/presentation/widgets/tasks/TaskInfo";
import { Comments } from "@/presentation/widgets/tasks/Comments";
import { useGetTask } from "@/application/tasks/hooks/useTasks";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";

export default function TaskPage() {
  const { data, isLoading, isError, error } = useGetTask();

  if (isLoading) return <LoadingScreen />;
  if (isError) return <div>Ошибка: {error.message}</div>;
  if (!data) return <div>Уууупппс....такой задачи не существует</div>;

  return (
    <>
      <MainContainer>
        <DashboardHeader />
        <div className="container">
          <BackButton />
        </div>
        <div className="content">
          <TaskInfo task={data} />
          <Comments />
        </div>
      </MainContainer>
    </>
  );
}
