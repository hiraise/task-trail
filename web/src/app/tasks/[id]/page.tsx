"use client";

import "./styles.css";

import { BackButton } from "@/presentation/ui/BackButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { useTask } from "@/application/tasks/hooks/useTask";
import { TaskInfo } from "@/presentation/widgets/tasks/TaskInfo";
import ChangeTaskStatusModal from "@/presentation/widgets/modals/ChangeTaskStatusModal";
import { MODAL_TYPE, useTaskModal } from "../TaskModalContext";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";

export function TaskComments() {
  return (
    <div className="task-comments">
      <h1>Комментарии</h1>
    </div>
  );
}

export default function TaskPage() {
  const { task } = useTask();
  const { isOpen, close } = useTaskModal();

  if (!task) return <LoadingScreen />;

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
      {/* Modal */}
      <ChangeTaskStatusModal
        currentStatus={task.status}
        isOpen={isOpen(MODAL_TYPE.CHANGE_STATUS)}
        onClose={close}
        onBack={close}
      />
    </>
  );
}
