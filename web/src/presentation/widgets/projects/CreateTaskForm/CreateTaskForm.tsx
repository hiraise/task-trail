"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import styles from "./CreateTaskForm.module.css";
import { Input, Textarea } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { AssigneeSelection, ProjectSelection } from "./FormSelectionOptions";
import { useCreateTaskForm } from "@/application/tasks/hooks/useCreateTaskForm";
import { tasksTexts } from "@/shared/locales/tasks";
import { FormValues } from "./CreateTaskForm.types";

interface CreateTaskFormProps {
  onSubmit: () => void;
}

export function CreateTaskForm({ onSubmit }: CreateTaskFormProps) {
  const form = useForm<FormValues>({
    mode: "onChange",
  });

  const { state, initialData, setState, handleSelectAssignee, handleSelectProject, submitForm } =
    useCreateTaskForm(form);

  useEffect(() => {
    form.reset(initialData);
  }, [form, initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    control,
  } = form;

  const submitHandler = async (data: FormValues) => {
    await submitForm(data);
    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.inputFields}>
        <Input
          {...register("name", {
            required: tasksTexts.requiredField,
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
          render={() => (
            <AssigneeSelection
              username={state.assignee?.username || state.assignee?.email}
              onClick={handleSelectAssignee}
            />
          )}
        />
        <Controller
          name={"projectId"}
          control={control}
          rules={{ required: tasksTexts.requiredField }}
          render={({ fieldState }) => (
            <>
              <ProjectSelection project={state.project?.name} onClick={handleSelectProject} />
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
