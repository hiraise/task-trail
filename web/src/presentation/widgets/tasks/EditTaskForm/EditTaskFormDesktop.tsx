import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./EditTaskFormDesktop.module.css";

import { Input, Textarea } from "@/presentation/ui/Input";
import { FormValues, schema } from "./schema";
import { TEXTS } from "@/shared/locales/texts";
import { InputStack, SubmitButton } from "../../auth/_components";
import { Task } from "@/domain/task/task.entity";
import { FormFieldError } from "@/presentation/ui/FormFieldError";

interface EditTaskFormDesktop {
  task?: Partial<Task>;
  submitHandler: (data: FormValues) => Promise<void>;
}

export function EditTaskFormDesktop({ task, submitHandler }: EditTaskFormDesktop) {
  const form = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || "",
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
        <InputStack>
          <Input
            id="title"
            type="text"
            placeholder={TEXTS.tasks.titlePlaceholder}
            {...register("title", { required: "Это поле обязательно" })}
          />
          {errors.title && <FormFieldError>{errors.title.message as string}</FormFieldError>}
        </InputStack>
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
        <SubmitButton $variant="primary" type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting || isLoading ? TEXTS.saving : TEXTS.save}
        </SubmitButton>
      </div>
    </form>
  );
}
