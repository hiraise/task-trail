import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { errorMessage } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { projectsTexts } from "@/shared/locales/projects";
import { TEXTS } from "@/shared/locales/texts";
import { interpolate } from "@/shared/utils/interpolate";

import { ProjectKeyField } from "../ProjectKeyField";

import styles from "./EditProjectForm.module.css";
import type { FormValues } from "./schema";
import { schema } from "./schema";

interface EditProjectFormProps {
  /** Without key the form has no key field: only the owner changes it */
  defaultValues: FormValues;
  /** Throws the request error: a taken key is shown under its field */
  submitHandler: (data: FormValues) => Promise<void>;
}

export function EditProjectForm({ defaultValues, submitHandler }: EditProjectFormProps) {
  const {
    handleSubmit,
    register,
    control,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues,
  });
  const key = (useWatch({ control, name: "key" }) ?? "").trim().toUpperCase();
  const keyChanged = defaultValues.key !== undefined && key !== "" && key !== defaultValues.key;

  const onSubmit = async (data: FormValues) => {
    try {
      await submitHandler(data);
    } catch (error) {
      // useEditProject has shown the other errors
      if (hasErrorCode(error, "PROJECT_KEY_TAKEN")) {
        setError("key", { message: errorMessage(error, projectsTexts.updateProjectFailed) });
      }
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
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
        {defaultValues.key !== undefined && (
          <ProjectKeyField
            {...register("key")}
            disabled={isSubmitting}
            error={errors.key?.message}
            hint={
              keyChanged
                ? interpolate(projectsTexts.keyChangeHint, { old: defaultValues.key, new: key })
                : undefined
            }
          />
        )}
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
