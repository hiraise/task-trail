import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Task } from "@/domain/models/Task";
import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./EditTaskFormDesktop.module.css";
import type { FormValues } from "./schema";
import { schema } from "./schema";

interface EditTaskFormDesktop {
  task?: Partial<Task>;
  submitHandler: (data: FormValues) => Promise<void>;
}

export function EditTaskFormDesktop({ task, submitHandler }: EditTaskFormDesktop) {
  const form = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.name || "",
      description: task?.description || "",
    },
  });
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const isLoading = false;

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.formFields}>
        <div className={styles.inputWrapper}>
          <Input
            id="title"
            type="text"
            placeholder={TEXTS.tasks.titlePlaceholder}
            {...register("title", { required: "Это поле обязательно" })}
          />
          {errors.title && <FormFieldError>{errors.title.message as string}</FormFieldError>}
        </div>
        <Textarea
          rows={3}
          id="description"
          aria-invalid={!!errors.description}
          aria-describedby="description-error"
          placeholder={TEXTS.tasks.descriptionPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
          className="textarea"
          {...register("description")}
        />
      </div>
      <div className={styles.buttons}>
        <SubmitButton variant="primary" type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting || isLoading ? TEXTS.saving : TEXTS.save}
        </SubmitButton>
      </div>
    </form>
  );
}
