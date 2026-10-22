import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { IconInput, SubmitButton } from "@/presentation/shared";
import { passwordField, usernameField } from "@/presentation/shared/forms/fields";
import { ICONS } from "@/shared/config/icons";
import { authTexts } from "@/shared/locales/auth";

import { useAcceptInvitation } from "../../hooks";
import { AuthField, PasswordField } from "../AuthForm";
import formStyles from "../AuthForm/AuthForm.module.css";
import { PrivacyPolicyText } from "../PrivacyPolicyText";

const schema = z.object({ username: usernameField, password: passwordField });

type FormData = z.infer<typeof schema>;

interface InviteFormProps {
  token: string;
  /** Email from the invitation: the account is created for it, it cannot be changed */
  email: string;
}

/** Accepting an invitation: name and password, the email comes from the invitation (ADR-0016). */
export function InviteForm({ token, email }: InviteFormProps) {
  const { mutate: accept, isPending } = useAcceptInvitation();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const submit = (data: FormData) => accept({ token, ...data });

  return (
    <FormProvider {...form}>
      <form className={formStyles.form} onSubmit={form.handleSubmit(submit)} noValidate>
        <div className={formStyles.group}>
          <div className={formStyles.field}>
            <IconInput
              icon={ICONS.mail}
              id="email"
              type="email"
              value={email}
              label={authTexts.emailPlaceholder}
              placeholder={authTexts.emailPlaceholder}
              autoComplete="username"
              readOnly
              disabled
            />
          </div>
          <AuthField
            name="username"
            icon={ICONS.profile}
            placeholder={authTexts.usernamePlaceholder}
            autoComplete="name"
          />
          <PasswordField name="password" autoComplete="new-password" />
        </div>
        <div className={formStyles.group}>
          <SubmitButton className="btn-font-m" disabled={isPending}>
            {isPending ? authTexts.invite.accepting : authTexts.invite.accept}
          </SubmitButton>
          <PrivacyPolicyText btnName={authTexts.invite.accept} />
        </div>
      </form>
    </FormProvider>
  );
}
