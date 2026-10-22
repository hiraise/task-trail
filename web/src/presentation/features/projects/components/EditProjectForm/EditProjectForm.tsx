import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./EditProjectForm.module.css";
import type { FormValues } from "./schema";
import { schema } from "./schema";

interface EditProjectFormProps {
  defaultValues: FormValues;
  submitHandler: (data: FormValues) => Promise<void>;
}

export function EditProjectForm({ defaultValues, submitHandler }: EditProjectFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.formFields}>
        <div className={styles.inputWrapper}>
          <Input
            id="name"
            type="text"
            placeholder={TEXTS.projects.titlePlaceholder}
            aria-invalid={!!errors.name}
            disabled={isSubmitting}
            {...register("name")}
          />
          {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
        </div>
        <Textarea
          rows={3}
          id="description"
          aria-invalid={!!errors.description}
          placeholder={TEXTS.projects.descriptionPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
          className="textarea"
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
