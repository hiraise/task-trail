import { useEffect } from "react";
import { useForm } from "react-hook-form";

import styles from "./PersonalDataFormMobile.module.css";

import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { TEXTS } from "@/shared/locales/texts";
import { FormValues, schema } from "./schema";
import { useUpdateUser } from "@/application/user/hooks/useUpdateUser";
import { getDisplayName } from "@/shared/utils/getDisplayName";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitButton } from "../../auth/_components";
import { TextInputField } from "./TextInputField";

export function PersonalDataFormMobile() {
  const { user, update } = useUpdateUser();

  const initialUsername = getDisplayName(user);
  const initialEmail = user?.email;

  const form = useForm<FormValues>({
    defaultValues: { username: initialUsername, email: initialEmail },
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const username = form.watch("username");

  useEffect(() => {
    reset({ username: initialUsername });
  }, [initialUsername, reset]);

  const submitHandler = async (data: FormValues) => {
    if (initialUsername === data.username) return;
    await update.mutateAsync({ username: data.username });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.form}>
      <div className={styles.formField}>
        <label htmlFor="username" className="body-med">
          {TEXTS.profile.usernameLabel}
        </label>
        <div className={styles.input}>
          <TextInputField
            id="username"
            {...register("username")}
            placeholder={TEXTS.profile.usernamePlaceholder}
            aria-invalid={!!errors.username}
            aria-describedby="username-error"
            disabled={isSubmitting}
            autoComplete="off"
            hasError={!!errors.username}
            showCleanButton={(username ?? "").length > 0}
            onClean={() => reset({ username: "" })}
          />
          {errors.username && <FormFieldError>{errors.username.message}</FormFieldError>}
        </div>
      </div>
      <div className={styles.formField}>
        <label htmlFor="email" tabIndex={-1} className="body-med">
          {TEXTS.profile.emailLabel}
        </label>
        <div className={styles.input}>
          <TextInputField id="email" type="email" defaultValue={initialEmail} disabled />
          <span className="caption-reg">{TEXTS.profile.changeEmailDescription}</span>
        </div>
      </div>
      <div className={styles.button}>
        <SubmitButton type="submit" className="btn-font-m">
          {TEXTS.save}
        </SubmitButton>
      </div>
    </form>
  );
}
