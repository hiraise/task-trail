"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./LoginFormDesktop.module.css";

import { ROUTES } from "@/infrastructure/config/routes";
import { authTexts } from "@/shared/locales/auth";
import { ICONS } from "@/infrastructure/config/icons";
import { Input, SubmitButton } from "../_components";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { useLogin } from "@/application/auth/hooks/useLogin";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";

function InputStack({ children }: { children: React.ReactNode }) {
  return <div className={styles.inputStack}>{children}</div>;
}

const schema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
});

type FormData = z.infer<typeof schema>;

export function LoginFormDesktop() {
  const { mutateAsync: login, isPending: isLoading } = useLogin();
  const form = useForm<FormData>({ mode: "onChange", resolver: zodResolver(schema) });
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const submitHandler = async (data: FormData) => {
    await login({ email: data.email, password: data.password });
    console.log("Form values: ", data);
  };
  return (
    <form className={styles.container} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.formItems}>
        <InputStack>
          <Input
            icon={ICONS.mail}
            id="email"
            type="email"
            {...register("email")}
            placeholder="Email"
            label="email"
            autoComplete="email"
            hasError={!!errors.email}
          />
          {errors.email && <FormFieldError>{errors.email.message}</FormFieldError>}
        </InputStack>
        <InputStack>
          <Input
            icon={ICONS.lock}
            id="password"
            type="password"
            {...register("password")}
            placeholder={authTexts.login.passwordPlaceholder}
            label={authTexts.login.passwordPlaceholder}
            autoComplete="none"
            hasError={!!errors.password}
          />
          {errors.password && <FormFieldError>{errors.password.message}</FormFieldError>}
        </InputStack>
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
  );
}
