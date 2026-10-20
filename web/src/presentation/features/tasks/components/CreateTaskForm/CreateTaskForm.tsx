"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { tasksTexts } from "@/shared/locales/tasks";

import { useCreateTask } from "../../hooks";
import { useCreateTaskFormStore } from "../../store/createTaskFormStore";

import styles from "./CreateTaskForm.module.css";
import { AssigneeSelection, ProjectSelection } from "./FormSelectionOptions";
import type { CreateTaskFormData } from "./schema";
import { CreateTaskSchema } from "./schema";

interface CreateTaskFormProps {
  onSubmit: () => void;
}

export function CreateTaskForm({ onSubmit }: CreateTaskFormProps) {
  const store = useCreateTaskFormStore();
  const { showSelectAssignee, showSelectProject } = useGlobalModals();
  const { mutateAsync: createTask } = useCreateTask();

  useEffect(() => {
    store.initialize();
  }, [store]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(CreateTaskSchema),
    mode: "onChange",
    defaultValues: {
      name: store.draft?.getName(),
      description: store.draft?.getDescription(),
    },
  });

  const formValues = useWatch({ control });

  // Sync name with state
  useEffect(() => {
    if (formValues.name !== undefined && formValues.name !== store.draft?.getName()) {
      store.setName(formValues.name);
    }
  }, [formValues.name, store]);

  // Sync description with state
  useEffect(() => {
    if (
      formValues.description !== undefined &&
      formValues.description !== store.draft?.getDescription()
    ) {
      store.setDescription(formValues.description || "");
    }
  }, [formValues.description, store]);

  const handleSelectAssignee = async () => {
    const result = await showSelectAssignee({
      projectId: store.draft?.getProjectId() ?? "",
      userId: store.draft?.getAssigneeId() ?? "",
    });

    if (!result) return;
    store.setAssignee(result);
  };

  const handleSelectProject = async () => {
    const result = await showSelectProject(store.draft?.getProjectId() ?? "");

    if (!result) return;
    await store.setProject(result);
  };

  const submitHandler = async () => {
    if (!store.draft) return;
    const dto = store.draft.toPersistenceDto();

    await createTask(dto);
    store.reset();
    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.inputFields}>
        <Input {...register("name")} placeholder={tasksTexts.taskNamePlaceholder} />
        {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
        <Textarea
          rows={3}
          id="taskDescription"
          {...register("description")}
          aria-invalid={!!errors.description}
          aria-describedby="taskDescription-error"
          placeholder={tasksTexts.taskDescriptionPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
          className={styles.textarea}
        />
        {errors.description && <FormFieldError>{errors.description.message}</FormFieldError>}
        <Controller
          name={"assigneeId"}
          control={control}
          defaultValue={store.assignee?.name}
          render={() => (
            <AssigneeSelection
              username={store.assignee?.name || store.assignee?.email}
              onClick={handleSelectAssignee}
            />
          )}
        />
        <Controller
          name={"projectId"}
          control={control}
          defaultValue={store.project?.name}
          render={() => (
            <ProjectSelection project={store.project?.name} onClick={handleSelectProject} />
          )}
        />
        {errors.projectId && <FormFieldError>{errors.projectId.message}</FormFieldError>}
      </div>
      <SubmitButton disabled={isSubmitting}>
        {isSubmitting ? tasksTexts.submittingText : tasksTexts.buttonText}
      </SubmitButton>
    </form>
  );
}
