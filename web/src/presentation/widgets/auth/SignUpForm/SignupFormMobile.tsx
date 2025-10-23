"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./SignupFormMobile.module.css";

import { SubmitButton } from "../_components";
import { authTexts } from "@/shared/locales/auth";
import { useSignUp } from "@/application/auth/hooks/useSignUp";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";
import { AuthFormFieldsDesktop, schema, type FormData } from "../AuthFormFields";

export const SignupFormMobile = () => {
  const form = useForm<FormData>({ mode: "onSubmit", resolver: zodResolver(schema) });
  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = form;
  const { mutateAsync: signUp, isPending: isLoading } = useSignUp();

  const submitHandler = async (data: FormData) => {
    if (!isValid) return;
    await signUp({ email: data.email, password: data.password });
  };

  return (
    <FormProvider {...form}>
      <form className={styles.container} onSubmit={handleSubmit(submitHandler)}>
        <div className={styles.formItems}>
          <AuthFormFieldsDesktop />
        </div>
        <div className={styles.formItems}>
          <SubmitButton className="btn-font-m" disabled={isLoading || isSubmitting}>
            {isSubmitting || isLoading ? authTexts.signup.signingUp : authTexts.signup.signup}
          </SubmitButton>
          <PrivacyPolicyDesktop btnName={authTexts.signup.signup} />
        </div>
      </form>
    </FormProvider>
  );
};
