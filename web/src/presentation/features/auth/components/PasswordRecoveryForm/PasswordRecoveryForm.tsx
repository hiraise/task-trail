import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { SubmitButton } from "@/presentation/shared";
import { emailField } from "@/presentation/shared/forms/fields";
import { ICONS } from "@/shared/config/icons";
import { authTexts } from "@/shared/locales/auth";

import { useRecoveryPassword } from "../../hooks";
import { AuthField } from "../AuthForm";
import formStyles from "../AuthForm/AuthForm.module.css";
import { PrivacyPolicyText } from "../PrivacyPolicyText";

const schema = z.object({ email: emailField });

type FormData = z.infer<typeof schema>;

export function PasswordRecoveryForm() {
  const { mutate: recover, isPending } = useRecoveryPassword();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <FormProvider {...form}>
      <form className={formStyles.form} onSubmit={form.handleSubmit((data) => recover(data))} noValidate>
        <AuthField
          name="email"
          icon={ICONS.mail}
          type="email"
          placeholder={authTexts.emailPlaceholder}
          autoComplete="email"
        />
        <div className={formStyles.group}>
          <SubmitButton className="btn-font-m" disabled={isPending}>
            {isPending ? authTexts.sending : authTexts.send}
          </SubmitButton>
          <PrivacyPolicyText btnName={authTexts.send} />
        </div>
      </form>
    </FormProvider>
  );
}
