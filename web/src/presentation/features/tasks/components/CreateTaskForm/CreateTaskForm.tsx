"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { useCreateTaskFormStore } from "@/presentation/features/tasks/store/createTaskFormStore";
import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { tasksTexts } from "@/shared/locales/tasks";

import { useCreateTask } from "../../hooks";

import styles from "./CreateTaskForm.module.css";
import { AssigneeSelection, ProjectSelection } from "./FormSelectionOptions";

const createTaskSchema = z.object({
  name: z
    .string()
    .min(6, "Task name must be at least 6 characters")
    .max(100, "Task name must not exceed 100 characters"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
  projectId: z.string().min(1, tasksTexts.requiredField),
  assigneeId: z.string().optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    mode: "onChange",
    defaultValues: {
      name: store.draft?.getName(),
      description: store.draft?.getDescription(),
    },
  });

  const formValues = watch();

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
