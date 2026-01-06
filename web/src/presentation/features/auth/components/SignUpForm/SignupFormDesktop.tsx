"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { useSignUp } from "@/presentation/features/auth/hooks";
import { SubmitButton } from "@/presentation/shared";
import { authTexts } from "@/shared/locales/auth";

import { AuthFormFieldsDesktop, schema, type FormData } from "../AuthFormFields";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";

import styles from "./SignupFormDesktop.module.css";

export function SignupFormDesktop() {
  const form = useForm<FormData>({ mode: "onChange", resolver: zodResolver(schema) });
  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = form;
  const { mutateAsync: signUp, isPending: isLoading } = useSignUp();

  const submitHandler = async (data: FormData) => {
    await signUp({ email: data.email, password: data.password });
  };
  return (
    <FormProvider {...form}>
      <form className={styles.container} onSubmit={handleSubmit(submitHandler)}>
        <div className={styles.formItems}>
          <AuthFormFieldsDesktop />
        </div>
        <div className={styles.formItems}>
          <SubmitButton className="btn-font-m" disabled={!isValid || isSubmitting}>
            {isSubmitting || isLoading ? authTexts.signup.signingUp : authTexts.signup.signup}
          </SubmitButton>
          <PrivacyPolicyDesktop btnName={authTexts.signup.signup} />
        </div>
      </form>
    </FormProvider>
  );
}
