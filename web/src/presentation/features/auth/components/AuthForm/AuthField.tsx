import type { ComponentType } from "react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { FormFieldError, IconButton, IconInput } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { authTexts } from "@/shared/locales/auth";

import styles from "./AuthForm.module.css";

interface AuthFieldProps {
  name: string;
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
}

/** Auth form field with an icon; bound to the form by name via FormProvider. */
export function AuthField({ name, icon, placeholder, type = "text", autoComplete }: AuthFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message;

  return (
    <div className={styles.field}>
      <IconInput
        icon={icon}
        id={name}
        type={type}
        {...register(name)}
        placeholder={placeholder}
        label={placeholder}
        autoComplete={autoComplete}
        hasError={!!error}
      />
      {error && <FormFieldError>{String(error)}</FormFieldError>}
    </div>
  );
}

interface PasswordFieldProps {
  name: string;
  placeholder?: string;
  /** `current-password` for sign-in, `new-password` where a password is invented */
  autoComplete: "current-password" | "new-password";
}

/** Password field with a "show" button. */
export function PasswordField({
  name,
  placeholder = authTexts.passwordPlaceholder,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message;

  return (
    <div className={styles.field}>
      <div className={styles.passwordInput}>
        <IconInput
          icon={ICONS.lock}
          id={name}
          type={visible ? "text" : "password"}
          {...register(name)}
          placeholder={placeholder}
          label={placeholder}
          autoComplete={autoComplete}
          hasError={!!error}
        />
        <div className={styles.passwordToggle}>
          <IconButton
            icon={visible ? ICONS.hide : ICONS.show}
            size="32px"
            type="button"
            aria-label={visible ? authTexts.hidePassword : authTexts.showPassword}
            onClick={() => setVisible((prev) => !prev)}
          />
        </div>
      </div>
      {error && <FormFieldError>{String(error)}</FormFieldError>}
    </div>
  );
}
