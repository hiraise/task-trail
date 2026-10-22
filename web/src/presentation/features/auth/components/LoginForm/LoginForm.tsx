import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { SubmitButton } from "@/presentation/shared";
import { emailField, passwordField } from "@/presentation/shared/forms/fields";
import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { useLogin } from "../../hooks";
import { AuthField, PasswordField } from "../AuthForm";
import formStyles from "../AuthForm/AuthForm.module.css";
import { PrivacyPolicyText } from "../PrivacyPolicyText";

const schema = z.object({ email: emailField, password: passwordField });

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <FormProvider {...form}>
      <form className={formStyles.form} onSubmit={form.handleSubmit((data) => login(data))} noValidate>
        <div className={formStyles.group}>
          <AuthField
            name="email"
            icon={ICONS.mail}
            type="email"
            placeholder={authTexts.emailPlaceholder}
            autoComplete="email"
          />
          <PasswordField name="password" autoComplete="current-password" />
          <Link to={ROUTES.passwordRecovery} className={formStyles.link}>
            <span className="btn-font-s">{authTexts.login.forgotPassword}</span>
          </Link>
        </div>
        <div className={formStyles.group}>
          <SubmitButton className="btn-font-m" disabled={isPending}>
            {isPending ? authTexts.login.loggingIn : authTexts.login.login}
          </SubmitButton>
          <PrivacyPolicyText btnName={authTexts.login.login} />
        </div>
      </form>
    </FormProvider>
  );
}
