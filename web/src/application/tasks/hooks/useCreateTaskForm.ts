import { useCallback, useEffect, useMemo } from "react";

import { useStore } from "@/shared/hooks/useStore";
import { createTaskFormStore, TaskFormData } from "@/shared/store/createTaskFormStore";
import { useTask } from "@/application/tasks/hooks/useTask";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { selectMemberAndProject } from "../slices/taskSelectors";
import { FormValues } from "@/presentation/widgets/projects/CreateTaskForm/CreateTaskForm.types";

const selector = (state: TaskFormData) => state;

export function useCreateTaskForm() {
  const { showSelectAssignee, showSelectProject } = useGlobalModals();
  const state = useStore(createTaskFormStore, selector);
  const { create } = useTask();
  const { project } = useAppSelector((s) =>
    selectMemberAndProject(s, state.assignee?.id, state.project?.id)
  );

  /**
   * Synchronizes the `project` field in the `createTaskFormStore` with the selected project from the store.
   *
   * If the form state does not have a project but a project is available from the selector,
   * this effect sets the project in the form store to ensure consistency.
   *
   * @remarks
   * This effect runs whenever the `project` or `state.project` dependencies change.
   *
   * @param project - The currently selected project from the store.
   * @param state.project - The project currently set in the form state.
   */
  useEffect(() => {
    if (!state.project && project) {
      createTaskFormStore.set({ project: project });
    }
  }, [project, state.project]);

  const setState = useCallback((partialState: Partial<TaskFormData>) => {
    createTaskFormStore.set(partialState);
  }, []);

  /**
   * Memoized initial form data for creating a task.
   *
   * Contains the current values for the task name, description, assignee ID, and project ID
   * from the form state. Useful for initializing form fields or resetting the form.
   *
   * @remarks
   * This value is recomputed whenever the form state changes.
   *
   * @returns An object with the following properties:
   * - `name`: The task name from the form state.
   * - `description`: The task description from the form state.
   * - `assigneeId`: The ID of the selected assignee, if any.
   * - `projectId`: The ID of the selected project, if any.
   */
  const initialData = useMemo(() => {
    return {
      name: state.name,
      description: state.description,
      assigneeId: state.assignee?.id,
      projectId: state.project?.id,
    };
  }, [state]);

  const submitForm = useCallback(
    async (data: FormValues) => {
      console.log("Final task data:", data);
      await create(data);
      createTaskFormStore.reset();
    },
    [create]
  );

  const handleSelectAssignee = async () => {
    const result = await showSelectAssignee();
    if (!result) return;
    createTaskFormStore.set({ assignee: result });
  };

  const handleSelectProject = async () => {
    const result = await showSelectProject();
    if (!result) return;
    createTaskFormStore.set({ project: result });
  };

  return {
    state,
    initialData,
    setState,
    submitForm,
    handleSelectAssignee,
    handleSelectProject,
  };
}
