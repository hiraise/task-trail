import clsx from "clsx";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

import { FormFieldError, InputFieldMobile } from "@/presentation/shared";
import { formStyles } from "@/presentation/shared/forms/FormLayout";

import styles from "./MailForm.module.css";

interface MailFieldProps {
  name: string;
  label: string;
  labelClass: string;
  input: UseFormRegisterReturn;
  error?: FieldError;
  disabled: boolean;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
  password?: boolean;
}

/** Поле формы почты: подпись, ввод и ошибка либо подсказка под ним. */
export function MailField(props: MailFieldProps) {
  const { name, label, labelClass, input, error, disabled, placeholder, hint, wide, password } =
    props;
  const id = `mail-${name}`;

  return (
    <div className={clsx(formStyles.field, wide && formStyles.wide)}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className={formStyles.control}>
        <InputFieldMobile
          id={id}
          mode={password ? "password" : "text"}
          {...input}
          placeholder={placeholder}
          aria-invalid={!!error}
          disabled={disabled}
          autoComplete={password ? "new-password" : "off"}
          hasError={!!error}
          showSuffixButton={password}
        />
        {error ? (
          <FormFieldError>{error.message}</FormFieldError>
        ) : (
          hint && <span className={clsx("caption-reg", styles.hint)}>{hint}</span>
        )}
      </div>
    </div>
  );
}
