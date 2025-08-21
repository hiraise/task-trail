"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import styles from "./CreateTaskForm.module.css";
import { Input, Textarea } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { AssigneeSelection, ProjectSelection } from "./FormSelectionOptions";
import { useCreateTaskForm } from "@/application/tasks/hooks/useCreateTaskForm";
import { TaskPayload } from "@/domain/task/task.payload";
import { tasksTexts } from "@/shared/locales/tasks";

interface CreateTaskFormProps {
  onSubmit: () => void;
}

export function CreateTaskForm({ onSubmit }: CreateTaskFormProps) {
  const {
    state,
    projectName,
    memberName,
    setState,
    handleSelectAssignee,
    handleSelectProject,
    submitForm,
  } = useCreateTaskForm();

  const form = useForm<TaskPayload>({
    mode: "onChange",
    defaultValues: state,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
    control,
  } = form;

  useEffect(() => {
    setValue("assigneeId", state.assigneeId);
  }, [state.assigneeId, setValue]);

  useEffect(() => {
    setValue("projectId", state.projectId);
  }, [state.projectId, setValue]);

  const submitHandler = async (data: TaskPayload) => {
    await submitForm(data);
    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.inputFields}>
        <Input
          {...register("name", {
            required: "Это поле обязательно",
            onChange: (e) => setState({ name: e.target.value }),
          })}
          placeholder={tasksTexts.taskNamePlaceholder}
        />
        {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
        <Textarea
          rows={3}
          id="taskDescription"
          {...register("description", {
            onChange: (e) => setState({ description: e.target.value }),
          })}
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
          rules={{ required: "Это поле обязательно" }}
          render={({ field, fieldState }) => (
            <>
              <AssigneeSelection
                username={memberName}
                onClick={async () => {
                  await handleSelectAssignee();
                  field.onChange(state.assigneeId);
                  console.log("Assignee id: ", state.assigneeId);
                  console.log("Assignee id: ", field.value);
                }}
              />
              {fieldState.error && <FormFieldError>{fieldState.error.message}</FormFieldError>}
            </>
          )}
        />
        <Controller
          name={"projectId"}
          control={control}
          rules={{ required: "Это поле обязательно" }}
          render={({ field, fieldState }) => (
            <>
              <ProjectSelection
                project={projectName}
                onClick={async () => {
                  await handleSelectProject();
                  field.onChange(state.projectId);
                }}
              />
              {fieldState.error && <FormFieldError>{fieldState.error.message}</FormFieldError>}
            </>
          )}
        />
      </div>
      <SubmitButton disabled={!isValid || isSubmitting}>
        {isSubmitting ? tasksTexts.submittingText : tasksTexts.buttonText}
      </SubmitButton>
    </form>
  );
}
