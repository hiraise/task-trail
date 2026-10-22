import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Task } from "@/domain/models/Task";
import type { TaskChanges } from "@/domain/repositories/TaskRepository";
import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./EditTaskForm.module.css";
import { schema, type FormValues } from "./schema";

interface EditTaskFormProps {
  task: Task;
  /** Изменения — только то, что поменяли; ничего не поменяли — пустой объект */
  onSubmit: (changes: TaskChanges) => Promise<void>;
}

export function EditTaskForm({ task, onSubmit }: EditTaskFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: { name: task.name, description: task.description ?? "" },
  });

  const submitHandler = async (values: FormValues) => {
    const changes: TaskChanges = {};
    // Пустое описание — описания нет (null в контракте)
    const description = values.description || null;

    if (values.name !== task.name) changes.name = values.name;
    if (description !== (task.description ?? null)) changes.description = description;

    await onSubmit(changes);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.formFields}>
        <div className={styles.inputWrapper}>
          <Input
            id="taskName"
            type="text"
            placeholder={TEXTS.tasks.titlePlaceholder}
            aria-invalid={!!errors.name}
            autoComplete="off"
            {...register("name")}
          />
          {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
        </div>
        <Textarea
          rows={3}
          id="taskDescription"
          placeholder={TEXTS.tasks.descriptionPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
          {...register("description")}
        />
      </div>
      <div className={styles.buttons}>
        <SubmitButton variant="primary" type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? TEXTS.saving : TEXTS.save}
        </SubmitButton>
      </div>
    </form>
  );
}
