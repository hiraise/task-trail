import { useCallback, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

import { useCreateTaskFormStore, TaskFormData } from "@/shared/store/createTaskFormStore";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { FormValues } from "@/presentation/widgets/projects/CreateTaskForm/CreateTaskForm.types";
import { useCreateTask } from "./useTasks";
import { useGetTaskData } from "./useGetTaskData";

export function useCreateTaskForm(form: UseFormReturn<FormValues>) {
  const { showSelectAssignee, showSelectProject } = useGlobalModals();
  const state = useCreateTaskFormStore();

  const { mutateAsync: createTask } = useCreateTask();
  const { project } = useGetTaskData({
    assigneeId: state.assignee?.id,
    projectId: state.project?.id,
  });

  useEffect(() => {
    if (!state.project && project) {
      state.set({ project: project });
      if (project.id) {
        form.setValue("projectId", project.id, { shouldValidate: true });
      }
    }
  }, [state.project, form, state, project]);

  const initialData = useMemo(() => {
    return {
      name: state.name,
      description: state.description,
      assigneeId: state.assignee?.id,
      projectId: state.project?.id,
    };
  }, [state]);

  const setState = useCallback(
    (partialState: Partial<TaskFormData>) => {
      state.set(partialState);
    },
    [state]
  );

  const submitForm = useCallback(
    async (data: FormValues) => {
      await createTask(data);
      state.reset();
      form.reset();
    },
    [createTask, form, state]
  );

  const closeForm = useCallback(() => {
    state.reset();
    form.reset();
  }, [state, form]);

  const handleSelectAssignee = async () => {
    const result = await showSelectAssignee({
      projectId: state.project?.id,
      userId: state.assignee?.id,
    });
    if (!result) return;
    state.set({ assignee: result });
    form.setValue("assigneeId", result.id, { shouldValidate: true });
  };

  const handleSelectProject = async () => {
    const result = await showSelectProject(state.project?.id);
    if (!result) return;
    state.set({ project: result });
    form.setValue("projectId", result.id, { shouldValidate: true });
  };

  return {
    state,
    initialData,
    setState,
    submitForm,
    closeForm,
    handleSelectAssignee,
    handleSelectProject,
  };
}
