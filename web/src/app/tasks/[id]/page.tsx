"use client";

import "./styles.css";

import { BackButton } from "@/presentation/ui/BackButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { useTask } from "@/application/tasks/hooks/useTask";
import { TaskInfo } from "@/presentation/widgets/tasks/TaskInfo";
import ChangeTaskStatusModal from "@/presentation/widgets/modals/ChangeTaskStatusModal";
import { MODAL_TYPE, useTaskModal } from "../TaskModalContext";
import SelectAssigneeModal from "@/presentation/widgets/modals/SelectAssigneeModal";
import SelectProjectModal from "@/presentation/widgets/modals/SelectProjectModal";

export function TaskComments() {
  return (
    <div className="task-comments">
      <h1>Комментарии</h1>
    </div>
  );
}

export default function TaskPage() {
  const { task } = useTask();
  const { isOpen, close, back } = useTaskModal();

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
      {/* Modal */}
      <ChangeTaskStatusModal
        currentStatus={task.status}
        isOpen={isOpen(MODAL_TYPE.CHANGE_STATUS)}
        onClose={close}
        onBack={close}
      />
      <SelectAssigneeModal
        isOpen={isOpen(MODAL_TYPE.SELECT_ASSIGNEE)}
        onClose={close}
        onBack={back}
      />
      <SelectProjectModal
        isOpen={isOpen(MODAL_TYPE.SELECT_PROJECT)}
        onClose={close}
        onBack={back}
      />
    </>
  );
}
