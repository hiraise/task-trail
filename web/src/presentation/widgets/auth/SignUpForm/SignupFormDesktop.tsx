"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./SignupFormDesktop.module.css";

import { authTexts } from "@/shared/locales/auth";
import { SubmitButton } from "../_components";
import { useSignUp } from "@/application/auth/hooks/useSignUp";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";
import { AuthFormFieldsDesktop, schema, type FormData } from "../AuthFormFields";

export function SignupFormDesktop() {
  const form = useForm<FormData>({ mode: "onChange", resolver: zodResolver(schema) });
  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = form;
  const { mutateAsync: signUp, isPending: isLoading } = useSignUp();

  const submitHandler = async (data: FormData) => {
    await signUp({ email: data.email, password: data.password });
    console.log("Form values: ", data);
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
