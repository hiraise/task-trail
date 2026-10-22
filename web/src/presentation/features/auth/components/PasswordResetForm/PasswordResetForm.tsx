import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { SubmitButton } from "@/presentation/shared";
import { passwordField } from "@/presentation/shared/forms/fields";
import { authTexts } from "@/shared/locales/auth";

import { PasswordField } from "../AuthForm";
import formStyles from "../AuthForm/AuthForm.module.css";

const schema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, authTexts.confirmPasswordRequired),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: authTexts.passwordsDoNotMatch,
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

interface PasswordResetFormProps {
  onSubmit: (password: string) => void;
  isPending?: boolean;
}

export function PasswordResetForm({ onSubmit, isPending }: PasswordResetFormProps) {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <FormProvider {...form}>
      <form
        className={formStyles.form}
        onSubmit={form.handleSubmit((data) => onSubmit(data.password))}
        noValidate
      >
        <div className={formStyles.group}>
          <PasswordField
            name="password"
            placeholder={authTexts.newPasswordPlaceholder}
            autoComplete="new-password"
          />
          <PasswordField
            name="confirmPassword"
            placeholder={authTexts.confirmPasswordPlaceholder}
            autoComplete="new-password"
          />
        </div>
        <SubmitButton className="btn-font-m" disabled={isPending}>
          {isPending ? authTexts.passwordReset.submitting : authTexts.passwordReset.submit}
        </SubmitButton>
      </form>
    </FormProvider>
  );
}
