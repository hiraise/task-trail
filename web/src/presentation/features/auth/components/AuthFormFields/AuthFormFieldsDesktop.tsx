"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { FormFieldError, IconButton, IconInput } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { authTexts } from "@/shared/locales/auth";

import styles from "./AuthFormFieldsDesktop.module.css";

function InputStack({ children }: { children: React.ReactNode }) {
  return <div className={styles.inputStack}>{children}</div>;
}

export function AuthFormFieldsDesktop() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <InputStack>
        <IconInput
          icon={ICONS.mail}
          id="email"
          type="email"
          {...register("email")}
          placeholder={authTexts.emailPlaceholder}
          label={authTexts.emailPlaceholder}
          autoComplete="email"
          hasError={!!errors.email}
        />
        {errors.email && <FormFieldError>{errors.email.message as string}</FormFieldError>}
      </InputStack>
      <InputStack>
        <div className={styles.passwordInputContainer}>
          <IconInput
            icon={ICONS.lock}
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder={authTexts.passwordPlaceholder}
            label={authTexts.passwordPlaceholder}
            autoComplete="none"
            hasError={!!errors.password}
          />
          <div className={styles.showPasswordButton}>
            <IconButton
              icon={showPassword ? ICONS.hide : ICONS.show}
              size="32px"
              onClick={togglePasswordVisibility}
              type="button"
            />
          </div>
        </div>
        {errors.password && <FormFieldError>{errors.password.message as string}</FormFieldError>}
      </InputStack>
    </>
  );
}
