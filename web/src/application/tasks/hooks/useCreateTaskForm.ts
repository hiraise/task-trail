import { useCallback } from "react";

import { useStore } from "@/shared/hooks/useStore";
import { createTaskFormStore, TaskFormData } from "@/shared/store/createTaskFormStore";
import { TaskPayload } from "@/domain/task/task.payload";
import { useTask } from "@/application/tasks/hooks/useTask";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { selectMemberById, selectProjectById } from "../slices/taskSelectors";

const selector = (state: TaskFormData) => state;

export function useCreateTaskForm() {
  const { showSelectAssignee, showSelectProject } = useGlobalModals();
  const state = useStore(createTaskFormStore, selector);
  const { create } = useTask();
  const memberName = useAppSelector((s) => selectMemberById(s, state.assigneeId));
  const projectName = useAppSelector((s) => selectProjectById(s, state.projectId));

  const setState = useCallback((partialState: Partial<TaskFormData>) => {
    createTaskFormStore.set(partialState);
  }, []);

  const submitForm = useCallback(
    async (data: TaskPayload) => {
      console.log("Final task data:", data);
      await create(data);
      createTaskFormStore.reset();
    },
    [create]
  );

  const handleSelectAssignee = async () => {
    const result = await showSelectAssignee();
    if (!result) return;
    createTaskFormStore.set({ assigneeId: result.id });
  };

  const handleSelectProject = async () => {
    const result = await showSelectProject();
    if (!result) return;
    createTaskFormStore.set({ projectId: result.id });
  };

  return {
    state,
    projectName,
    memberName,
    setState,
    submitForm,
    handleSelectAssignee,
    handleSelectProject,
  };
}
