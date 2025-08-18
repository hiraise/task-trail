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

export function CreateTaskForm({ onSubmit, isLoading }: Props) {
  const { ...formValues } = useNewTask();

  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: formValues,
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

  return (
    <div className={styles.container}>
      <p className={styles.title}>{texts.title}</p>
      <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
        <div className={styles.inputFields}>
          <Input
            {...register("name", { required: "Это поле обязательно" })}
            placeholder={texts.taskNamePlaceholder}
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
          />
          {errors.description && <FormFieldError>{errors.description.message}</FormFieldError>}
          <Controller
            name={"assignee"}
            control={control}
            rules={{ required: "Это поле обязательно" }}
            render={({ field, fieldState }) => (
              <>
                <AssigneeSelection username={field.value} onChange={field.onChange} />
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
                <ProjectSelection project={field.value} onChange={field.onChange} />
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
