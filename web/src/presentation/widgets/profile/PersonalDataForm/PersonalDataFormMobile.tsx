import { useEffect } from "react";
import { useForm } from "react-hook-form";

import styles from "./PersonalDataFormMobile.module.css";
import { Stack } from "../../primitives/Stack";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { Input, InputLabel } from "@/presentation/ui/Input";
import { TEXTS } from "@/shared/locales/texts";
import { FormValues, schema } from "./schema";
import { useUpdateUser } from "@/application/user/hooks/useUpdateUser";
import { getDisplayName } from "@/shared/utils/getDisplayName";
import { zodResolver } from "@hookform/resolvers/zod";

export function PersonalDataFormMobile() {
  const { user, update } = useUpdateUser();

  const initialUsername = getDisplayName(user);
  const initialEmail = user?.email;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: { username: initialUsername, email: initialEmail },
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    reset({ username: initialUsername });
  }, [initialUsername, reset]);

  const submitHandler = async (data: FormValues) => {
    await update.mutateAsync({ username: data.username });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles["personal-data-form"]}>
      <Stack gap="4px">
        <InputLabel htmlFor="username">{TEXTS.profile.usernameLabel}</InputLabel>
        <Input
          id="username"
          {...register("username")}
          placeholder={TEXTS.profile.usernamePlaceholder}
          aria-invalid={!!errors.username}
          aria-describedby="username-error"
          disabled={isSubmitting}
          autoComplete="off"
        />
        {errors.username && <FormFieldError>{errors.username.message}</FormFieldError>}
      </Stack>
      <Stack gap="4px">
        <InputLabel htmlFor="email" tabIndex={-1}>
          {TEXTS.profile.emailLabel}
        </InputLabel>
        <Input id="email" type="email" value={initialEmail} disabled />
      </Stack>
      {/* Hidden submit button to allow form submission via Enter key */}
      <button type="submit" style={{ display: "none" }} aria-hidden />
    </form>
  );
}
