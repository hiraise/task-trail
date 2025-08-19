"use client";

import { Controller, useForm } from "react-hook-form";

import styles from "./CreateTaskForm.module.css";
import { FormValues } from "./CreateTaskForm.types";
import { Input, Textarea } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { AssigneeSelection, ProjectSelection } from "./FormSelectionOptions";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

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
  const { showSelectAssignee, showSelectProject } = useGlobalModals();

  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      assignee: "",
      project: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    control,
  } = form;

  const submitHandler = async (data: FormValues) => {
    await onSubmit();
    alert("Submitted data: " + JSON.stringify(data, null, 2));
  };

  const handleAssigneeChange = async () => {
    const result = await showSelectAssignee();
    if (!result) return;
    const selectedUsername = result.username || result.email;
    console.log("Selected assignee:", selectedUsername);
  };

  const handleProjectChange = async () => {
    const result = await showSelectProject();
    if (!result) return;
    console.log("Selected project:", result);
  };

  return (
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
  );
}
