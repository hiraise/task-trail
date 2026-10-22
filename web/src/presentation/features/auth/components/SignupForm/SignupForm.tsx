import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { SubmitButton } from "@/presentation/shared";
import { emailField, passwordField, usernameField } from "@/presentation/shared/forms/fields";
import { ICONS } from "@/shared/config/icons";
import { authTexts } from "@/shared/locales/auth";

import { useSignUp } from "../../hooks";
import { AuthField, PasswordField } from "../AuthForm";
import formStyles from "../AuthForm/AuthForm.module.css";
import { PrivacyPolicyText } from "../PrivacyPolicyText";

const schema = z.object({ username: usernameField, email: emailField, password: passwordField });

type FormData = z.infer<typeof schema>;

/** Первый аккаунт сервиса — он же администратор (ADR-0016). */
export function SignupForm() {
  const { mutate: signUp, isPending } = useSignUp();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <FormProvider {...form}>
      <form className={formStyles.form} onSubmit={form.handleSubmit((data) => signUp(data))} noValidate>
        <div className={formStyles.group}>
          <AuthField
            name="username"
            icon={ICONS.profile}
            placeholder={authTexts.usernamePlaceholder}
            autoComplete="name"
          />
          <AuthField
            name="email"
            icon={ICONS.mail}
            type="email"
            placeholder={authTexts.emailPlaceholder}
            autoComplete="email"
          />
          <PasswordField name="password" autoComplete="new-password" />
        </div>
        <div className={formStyles.group}>
          <SubmitButton className="btn-font-m" disabled={isPending}>
            {isPending ? authTexts.signup.signingUp : authTexts.signup.signup}
          </SubmitButton>
          <PrivacyPolicyText btnName={authTexts.signup.signup} />
        </div>
      </form>
    </FormProvider>
  );
}
