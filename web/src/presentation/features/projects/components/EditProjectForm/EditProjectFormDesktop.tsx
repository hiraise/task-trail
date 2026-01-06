import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./EditProjectFormDesktop.module.css";
import type { FormValues } from "./schema";
import { schema } from "./schema";

interface EditProjectFormDesktop {
  project?: Partial<ProjectResponseDto>;
  submitHandler: (data: FormValues) => Promise<void>;
}

export function EditProjectFormDesktop({ project, submitHandler }: EditProjectFormDesktop) {
  const form = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
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
            id="name"
            type="text"
            placeholder={TEXTS.projects.titlePlaceholder}
            {...register("name", { required: "Это поле обязательно" })}
          />
          {errors.name && <FormFieldError>{errors.name.message as string}</FormFieldError>}
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
