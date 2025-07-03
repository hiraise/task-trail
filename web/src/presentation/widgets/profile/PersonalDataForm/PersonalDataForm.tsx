import { useEffect } from "react";
import { useForm } from "react-hook-form";

import styles from "./PersonalDataForm.module.css";
import { Stack } from "../../primitives/Stack";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { userNameValidator } from "@/shared/utils/validate";
import LoadingScreen from "../../common/LoadingScreen";
import { Input, InputLabel } from "@/presentation/ui/Input";

const formTexts = {
  userNameLabel: "Username",
  userNamePlaceholder: "Введите имя пользователя",
  userEmailLabel: "Почта",
};

type FormValues = {
  username: string;
  email: string;
};

interface Props {
  initialUsername?: string;
  initialEmail: string;
  onSubmit: (data: Pick<FormValues, "username">) => void | Promise<void>;
}

export function PersonalDataForm({
  initialUsername = "",
  initialEmail,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: { username: initialUsername, email: initialEmail },
    mode: "onChange",
  });

  useEffect(() => {
    reset({ username: initialUsername });
  }, [initialUsername, reset]);

  const submitHandler = (data: FormValues) => {
    return onSubmit({ username: data.username });
  };

  if (isSubmitting) return <LoadingScreen />;

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className={styles["personal-data-form"]}
    >
      <Stack gap="4px">
        <InputLabel htmlFor="username">{formTexts.userNameLabel}</InputLabel>
        <Input
          id="username"
          {...register("username", userNameValidator)}
          placeholder={formTexts.userNamePlaceholder}
          aria-invalid={!!errors.username}
          aria-describedby="username-error"
          disabled={isSubmitting}
          autoComplete="off"
        />
        {errors.username && (
          <FormFieldError>{errors.username.message}</FormFieldError>
        )}
      </Stack>
      <Stack gap="4px">
        <InputLabel htmlFor="email" tabIndex={-1}>
          {formTexts.userEmailLabel}{" "}
        </InputLabel>
        <Input id="email" type="email" value={initialEmail} disabled />
      </Stack>
      {/* Hidden submit button to allow form submission via Enter key */}
      <button type="submit" style={{ display: "none" }} aria-hidden />
    </form>
  );
}
