import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion as m } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormFieldError, SubmitButton } from "@/presentation/shared";
import { Input } from "@/presentation/shared/ui/Input";
import { TEXTS } from "@/shared/locales/texts";

import { useGetCurrentUser, useUpdateUser } from "../../hooks";

import styles from "./PersonalDataFormDesktop.module.css";
import type { PersonalDataFormData } from "./schema";
import { PersonalDataSchema } from "./schema";

export function PersonalDataFormDesktop() {
  const { data: user } = useGetCurrentUser();
  const { mutateAsync: update } = useUpdateUser();

  const initialUsername = user?.username ?? undefined;
  const initialEmail = user?.email ?? undefined;

  const form = useForm<PersonalDataFormData>({
    defaultValues: { username: initialUsername, email: initialEmail },
    resolver: zodResolver(PersonalDataSchema),
    mode: "onChange",
  });

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const [focused, setFocused] = useState(false);

  const submitHandler = async (data: PersonalDataFormData) => {
    if (initialUsername !== data.username) {
      await update({ username: data.username });
    }
    setFocused(false);
  };

  const handleCancel = () => {
    setFocused(false);
    reset({ username: initialUsername });
  };

  useEffect(() => {
    reset({ username: initialUsername });
  }, [initialUsername, reset]);

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.inputFields}>
        <div className={styles.field}>
          <label htmlFor="username" className="body-reg-2">
            {TEXTS.profile.usernameLabel}
          </label>
          <Input
            id="username"
            {...register("username")}
            placeholder={TEXTS.profile.usernamePlaceholder}
            aria-invalid={!!errors.username}
            aria-describedby="username-error"
            disabled={isSubmitting}
            autoComplete="off"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {errors.username && <FormFieldError>{errors.username.message}</FormFieldError>}
        </div>
        <div className={styles.field}>
          <label htmlFor="email" className="body-reg-2">
            {TEXTS.profile.emailLabel}
          </label>
          <Input
            id="email"
            {...register("email")}
            placeholder={TEXTS.profile.emailPlaceholder}
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
            disabled
            autoComplete="off"
          />
          {errors.email && <FormFieldError>{errors.email.message}</FormFieldError>}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {focused && (
          <m.div
            key="buttons"
            className={styles.buttons}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "tween", duration: 0.15 }}
          >
            <SubmitButton variant="secondary" onClick={handleCancel} className="btn-font-s">
              {TEXTS.cancel}
            </SubmitButton>
            <SubmitButton
              variant="primary"
              type="submit"
              className="btn-font-s"
              disabled={!isValid}
            >
              {TEXTS.save}
            </SubmitButton>
          </m.div>
        )}
      </AnimatePresence>
    </form>
  );
}
