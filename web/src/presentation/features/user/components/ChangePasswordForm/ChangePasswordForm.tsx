import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, InputFieldMobile } from "@/presentation/shared";
import { useChangePassword } from "@/presentation/shared/hooks";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";

import {
  formClassName,
  formStyles as styles,
  labelClassName,
  FormFooter,
  type FormLayout,
  useFocusWithin,
} from "@/presentation/shared/forms/FormLayout";

import { schema, type FormValues } from "./schema";

const EMPTY: FormValues = { oldPassword: "", newPassword: "", confirmPassword: "" };

const FIELDS = [
  { name: "oldPassword", label: TEXTS.profile.oldPasswordLabel, autoComplete: "current-password" },
  { name: "newPassword", label: TEXTS.profile.newPasswordLabel, autoComplete: "new-password" },
  {
    name: "confirmPassword",
    label: TEXTS.profile.confirmPasswordLabel,
    autoComplete: "new-password",
  },
] as const;

interface ChangePasswordFormProps {
  layout: FormLayout;
}

/**
 * Password change. In the profile card the form is cleared after success, on a separate page it
 * returns to the profile.
 */
export function ChangePasswordForm({ layout }: ChangePasswordFormProps) {
  const inline = layout === "inline";
  const navigate = useNavigate();
  const { mutateAsync: changePassword } = useChangePassword();
  const { focused, setFocused, focusHandlers } = useFocusWithin();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: EMPTY,
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const values = useWatch({ control });

  const submitHandler = async (data: FormValues) => {
    try {
      await changePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword });
    } catch {
      return; // useChangePassword has shown the error
    }

    if (!inline) {
      navigate({ to: ROUTES.profile });

      return;
    }
    reset(EMPTY);
    setFocused(false);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const handleCancel = () => {
    reset(EMPTY);
    setFocused(false);
  };

  const labelClass = labelClassName(layout);

  return (
    <form
      className={formClassName(layout)}
      onSubmit={handleSubmit(submitHandler)}
      {...(inline ? focusHandlers : {})}
    >
      <div className={styles.fields}>
        {FIELDS.map(({ name, label, autoComplete }) => (
          <div key={name} className={clsx(styles.field, name === "oldPassword" && styles.wide)}>
            <label htmlFor={name} className={labelClass}>
              {label}
            </label>
            <div className={styles.control}>
              <InputFieldMobile
                id={name}
                mode="password"
                {...register(name)}
                placeholder={TEXTS.profile.passwordPlaceholder}
                aria-invalid={!!errors[name]}
                disabled={isSubmitting}
                autoComplete={autoComplete}
                hasError={!!errors[name]}
                showSuffixButton={!!values[name]}
              />
              {errors[name] && <FormFieldError>{errors[name].message}</FormFieldError>}
            </div>
          </div>
        ))}
      </div>
      <FormFooter
        layout={layout}
        focused={focused}
        dirty={isDirty}
        submitting={isSubmitting}
        submitText={TEXTS.profile.changePasswordSubmit}
        onCancel={handleCancel}
      />
    </form>
  );
}
