import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion as m } from "framer-motion";

import styles from "./PersonalDataFormDesktop.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { FormValues, schema } from "./schema";
import { SubmitButton } from "../../auth/_components";
import { Input, InputLabel } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { useUpdateUser } from "@/application/user/hooks/useUpdateUser";
import { getDisplayName } from "@/shared/utils/getDisplayName";

export function PersonalDataFormDesktop() {
  const { user, update } = useUpdateUser();

  const initialUsername = getDisplayName(user);
  const initialEmail = user?.email;

  const form = useForm<FormValues>({
    defaultValues: { username: initialUsername, email: initialEmail },
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const [focused, setFocused] = useState(false);

  const submitHandler = async (data: FormValues) => {
    await update.mutateAsync({ username: data.username });
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
          <InputLabel htmlFor="username">{TEXTS.profile.usernameLabel}</InputLabel>
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
          <InputLabel htmlFor="email">{TEXTS.profile.emailLabel}</InputLabel>
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
            <SubmitButton $variant="secondary" onClick={handleCancel} className="btn-font-s">
              {TEXTS.cancel}
            </SubmitButton>
            <SubmitButton
              $variant="primary"
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
