import { useCallback, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

import { useStore } from "@/shared/hooks/useStore";
import { createTaskFormStore, TaskFormData } from "@/shared/store/createTaskFormStore";
import { useTask } from "@/application/tasks/hooks/useTask";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { FormValues } from "@/presentation/widgets/projects/CreateTaskForm/CreateTaskForm.types";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { selectMemberAndProject } from "../slices/taskSelectors";

const selector = (state: TaskFormData) => state;

export function useCreateTaskForm(form: UseFormReturn<FormValues>) {
  const { showSelectAssignee, showSelectProject } = useGlobalModals();
  const state = useStore(createTaskFormStore, selector);
  const { create } = useTask();
  const { project } = useAppSelector((s) =>
    selectMemberAndProject(s, state.assignee?.id, state.project?.id)
  );

  useEffect(() => {
    if (!state.project && project) {
      createTaskFormStore.set({ project: project });
      if (project.id) {
        form.setValue("projectId", project.id, { shouldValidate: true });
      }
    }
  }, [project, state.project, form]);

  const initialData = useMemo(() => {
    return {
      name: state.name,
      description: state.description,
      assigneeId: state.assignee?.id,
      projectId: state.project?.id,
    };
  }, [state]);

  const setState = useCallback((partialState: Partial<TaskFormData>) => {
    createTaskFormStore.set(partialState);
  }, []);

  const submitForm = useCallback(
    async (data: FormValues) => {
      await create(data);
      createTaskFormStore.reset();
      form.reset();
    },
    [create, form]
  );

  const handleSelectAssignee = async () => {
    const result = await showSelectAssignee();
    if (!result) return;
    createTaskFormStore.set({ assignee: result });
    form.setValue("assigneeId", result.id, { shouldValidate: true });
  };

  const handleSelectProject = async () => {
    const result = await showSelectProject();
    if (!result) return;
    createTaskFormStore.set({ project: result });
    form.setValue("projectId", result.id, { shouldValidate: true });
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
