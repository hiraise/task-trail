import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, InputFieldMobile, SubmitButton } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import { useGetCurrentUser, useUpdateUser } from "../../hooks";

import styles from "./PersonalDataFormMobile.module.css";
import type { PersonalDataFormData } from "./schema";
import { PersonalDataSchema } from "./schema";

export function PersonalDataFormMobile() {
  const { data: user } = useGetCurrentUser();
  const { mutateAsync: update } = useUpdateUser();

  const initialUsername = user?.username;
  const initialEmail = user?.email;

  const form = useForm<PersonalDataFormData>({
    defaultValues: { username: initialUsername ?? undefined, email: initialEmail ?? undefined },
    resolver: zodResolver(PersonalDataSchema),
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = form;

  const username = useWatch({ control, name: "username" });

  useEffect(() => {
    reset({ username: initialUsername ?? undefined });
  }, [initialUsername, reset]);

  const submitHandler = async (data: PersonalDataFormData) => {
    if (initialUsername === data.username) return;
    await update({ username: data.username });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.form}>
      <div className={styles.formField}>
        <label htmlFor="username" className="body-med">
          {TEXTS.profile.usernameLabel}
        </label>
        <div className={styles.input}>
          <InputFieldMobile
            id="username"
            {...register("username")}
            placeholder={TEXTS.profile.usernamePlaceholder}
            aria-invalid={!!errors.username}
            aria-describedby="username-error"
            disabled={isSubmitting}
            autoComplete="off"
            mode="text"
            hasError={!!errors.username}
            showSuffixButton={(username ?? "").length > 0}
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
          <InputFieldMobile
            id="email"
            type="email"
            defaultValue={initialEmail}
            disabled
            mode="text"
          />
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
