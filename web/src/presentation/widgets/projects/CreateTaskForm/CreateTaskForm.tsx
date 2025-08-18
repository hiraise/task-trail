"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import styles from "./CreateTaskForm.module.css";
import { FormValues } from "./CreateTaskForm.types";
import { Input, Textarea } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { AssigneeSelection, ProjectSelection } from "./FormSelectionOptions";
import { useNewTask } from "@/app/tasks/NexTaskContext";
import { useTaskModals } from "@/application/tasks/hooks/useTaskModals";

const texts = {
  title: "Новая задача",
  taskNamePlaceholder: "Название задачи",
  taskDescriptionPlaceholder: "Описание задачи",
  assigneePlaceholder: "Выберите исполнителя",
  projectPlaceholder: "Выберите проект",
  buttonText: "Создать задачу",
  submittingText: "Создание задачи...",
};

interface Props {
  onSubmit: () => void | Promise<void>;
  isLoading?: boolean;
}

/**
 * CreateTaskForm component renders a form for creating a new task.
 *
 * @remarks
 * This implementation contains a temporary solution for synchronizing form state
 * through context (`useNewTask`). The form fields are updated via context setters
 * and reset when context values change. This approach may be refactored in the future
 * for improved state management.
 *
 * @param {() => void | Promise<void>} onSubmit - Callback invoked when the form is submitted.
 * @param {boolean} [isLoading] - Indicates if the form is in a loading/submitting state.
 *
 */
export function CreateTaskForm({ onSubmit, isLoading }: Props) {
  const { setFields, clearFields, initialValues, ...formValues } = useNewTask();
  const { showSelectAssignee, showSelectProject } = useTaskModals();

  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { ...formValues },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    control,
    reset,
    getValues,
  } = form;

  const submitHandler = async (data: FormValues) => {
    await onSubmit();
    alert("Submitted data: " + JSON.stringify(data, null, 2));
    reset(initialValues);
    clearFields();
  };

  // Reset form values when the context changes
  useEffect(() => {
    const currentValues = getValues();
    const shouldUpdate =
      formValues.assignee !== currentValues.assignee ||
      formValues.project !== currentValues.project;

    if (shouldUpdate) {
      reset({
        ...currentValues,
        assignee: formValues.assignee,
        project: formValues.project,
      });
    }
  }, [formValues, getValues, reset]);

  const handleAssigneeChange = async () => {
    const result = await showSelectAssignee();
    if (!result) return;
    const selectedUsername = result.username || result.email;
    setFields({ assignee: selectedUsername });
  };

  const handleProjectChange = async () => {
    const result = await showSelectProject();
    if (!result) return;
    setFields({ project: result.name });
  };

  return (
    <div className={styles.container}>
      <p className={styles.title}>{texts.title}</p>
      <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
        <div className={styles.inputFields}>
          <Input
            {...register("name", { required: "Это поле обязательно" })}
            placeholder={texts.taskNamePlaceholder}
            onChange={(e) => setFields({ name: e.target.value })}
          />
          {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
          <Textarea
            rows={3}
            id="taskDescription"
            {...register("description")}
            aria-invalid={!!errors.description}
            aria-describedby="taskDescription-error"
            placeholder={texts.taskDescriptionPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
            className={styles.textarea}
            onChange={(e) => setFields({ description: e.target.value })}
          />
          {errors.description && <FormFieldError>{errors.description.message}</FormFieldError>}
          <Controller
            name={"assignee"}
            control={control}
            rules={{ required: "Это поле обязательно" }}
            render={({ field, fieldState }) => (
              <>
                <AssigneeSelection username={field.value} onClick={handleAssigneeChange} />
                {fieldState.error && <FormFieldError>{fieldState.error.message}</FormFieldError>}
              </>
            )}
          />
          <Controller
            name={"project"}
            control={control}
            rules={{ required: "Это поле обязательно" }}
            render={({ field, fieldState }) => (
              <>
                <ProjectSelection project={field.value} onClick={handleProjectChange} />
                {fieldState.error && <FormFieldError>{fieldState.error.message}</FormFieldError>}
              </>
            )}
          ></Controller>
        </div>
        <SubmitButton disabled={!isValid || isSubmitting}>
          {isLoading ? texts.submittingText : texts.buttonText}
        </SubmitButton>
      </form>
    </div>
  );
}
