"use client";

import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./LoginFormDesktop.module.css";

import { ROUTES } from "@/infrastructure/config/routes";
import { authTexts } from "@/shared/locales/auth";
import { SubmitButton } from "../_components";
import { useLogin } from "@/application/auth/hooks/useLogin";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";
import { AuthFormFieldsDesktop, schema, type FormData } from "../AuthFormFields";

export function LoginFormDesktop() {
  const { mutateAsync: login, isPending: isLoading } = useLogin();
  const form = useForm<FormData>({ mode: "onChange", resolver: zodResolver(schema) });
  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = form;

  const submitHandler = async (data: FormData) => {
    await login({ email: data.email, password: data.password });
    console.log("Form values: ", data);
  };
  return (
    <FormProvider {...form}>
      <form className={styles.container} onSubmit={handleSubmit(submitHandler)}>
        <div className={styles.formItems}>
          <AuthFormFieldsDesktop />
          <Link href={ROUTES.passwordRecovery} className={styles.forgotPassword}>
            <span className="btn-font-s"> {authTexts.login.forgotPassword}</span>
          </Link>
        </div>
        <div className={styles.formItems}>
          <SubmitButton className="btn-font-m" disabled={!isValid || isSubmitting}>
            {isSubmitting || isLoading ? authTexts.login.loggingIn : authTexts.login.login}
          </SubmitButton>
          <PrivacyPolicyDesktop btnName={authTexts.login.login} />
        </div>
      </form>
    </FormProvider>
  );
}
