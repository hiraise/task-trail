"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";

import { SubmitButton } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";
import { authTexts } from "@/shared/locales/auth";

import { useLogin } from "../../hooks";
import { AuthFormFieldsDesktop, schema, type FormData } from "../AuthFormFields";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";

import styles from "./LoginFormMobile.module.css";

export function LoginFormMobile() {
  const { mutateAsync: login, isPending: isLoading } = useLogin();
  const form = useForm<FormData>({ mode: "onSubmit", resolver: zodResolver(schema) });
  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = form;

  const submitHandler = async (data: FormData) => {
    if (!isValid) return;
    await login({ email: data.email, password: data.password });
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
          <SubmitButton className="btn-font-m" disabled={isLoading || isSubmitting}>
            {isSubmitting || isLoading ? authTexts.login.loggingIn : authTexts.login.login}
          </SubmitButton>
          <PrivacyPolicyDesktop btnName={authTexts.login.login} />
        </div>
      </form>
    </FormProvider>
  );
}
