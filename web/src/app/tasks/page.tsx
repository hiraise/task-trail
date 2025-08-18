"use client";

import { IconButton } from "@/presentation/ui/IconButton";
import "./styles.css";

import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { ICONS } from "@/infrastructure/config/icons";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { mockTasks, TaskList } from "@/presentation/widgets/tasks/TaskList";
import { MODAL_TYPE, useTaskModal } from "./TaskModalContext";
import CreateTaskModal from "@/presentation/widgets/modals/CreateTaskModal";
import SortProjectsModal from "@/presentation/widgets/modals/SortProjectsModal";
import SelectAssigneeModal from "@/presentation/widgets/modals/SelectAssigneeModal";
import { useTaskModals } from "@/application/tasks/hooks/useTaskModals";
import SelectProjectModal from "@/presentation/widgets/modals/SelectProjectModal";

export const tasksTexts = {
  title: "Задачи",
  noTasks: "Нет задач",
  createFirstTask: "Создайте свою первую задачу!",
};

export default function TasksPage() {
  const { isOpen, close, back } = useTaskModal();
  const { showSortTasks, showCreateTask } = useTaskModals();
  const tasks = mockTasks;

  return (
    <>
      <MainContainer>
        <DashboardHeader />
        <div className="title-container">
          <h1>{tasksTexts.title}</h1>
          <IconButton icon={ICONS.sort} onClick={showSortTasks} />
        </div>
        {(!tasks || tasks.length === 0) && (
          <div className="empty-state">
            <h2>{tasksTexts.noTasks}</h2>
            <p>{tasksTexts.createFirstTask}</p>
          </div>
        )}
        <TaskList tasks={tasks} />
        <FloatingButton onClick={showCreateTask} variant="withBottomNav" />
        <BottomNavBar />
      </MainContainer>
      {/* Modals */}
      <CreateTaskModal isOpen={isOpen(MODAL_TYPE.CREATE_TASK)} onClose={close} />
      <SortProjectsModal isOpen={isOpen(MODAL_TYPE.SORT_TASKS)} onClose={close} />
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
