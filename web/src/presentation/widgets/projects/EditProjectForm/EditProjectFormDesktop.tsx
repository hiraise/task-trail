import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./EditProjectFormDesktop.module.css";

import { FormValues, schema } from "./schema";
import { TEXTS } from "@/shared/locales/texts";
import { InputStack, SubmitButton } from "../../auth/_components";
import { Input, Textarea } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { Project } from "@/domain/project/project.entity";

interface EditProjectFormDesktop {
  project?: Partial<Project>;
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
        <InputStack>
          <Input
            id="name"
            type="text"
            placeholder={TEXTS.projects.titlePlaceholder}
            {...register("name", { required: "Это поле обязательно" })}
          />
          {errors.name && <FormFieldError>{errors.name.message as string}</FormFieldError>}
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
