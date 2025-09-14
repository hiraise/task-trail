"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./AuthFormFieldsDesktop.module.css";

import { Input } from "../_components";
import { ICONS } from "@/infrastructure/config/icons";
import { authTexts } from "@/shared/locales/auth";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { IconButton } from "@/presentation/ui/IconButton";

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
        {errors.email && <FormFieldError>{errors.email.message as string}</FormFieldError>}
      </InputStack>
      <InputStack>
        <div className={styles.passwordInputContainer}>
          <Input
            icon={ICONS.lock}
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder={authTexts.login.passwordPlaceholder}
            label={authTexts.login.passwordPlaceholder}
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
