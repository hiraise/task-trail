import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, InputFieldMobile } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import { useGetCurrentUser, useUpdateUser } from "../../hooks";
import {
  formClassName,
  formStyles as styles,
  labelClassName,
  ProfileFormFooter,
  type ProfileFormLayout,
  useFocusWithin,
} from "../ProfileFormLayout";

import { PersonalDataSchema, type PersonalDataFormData } from "./schema";

interface PersonalDataFormProps {
  layout: ProfileFormLayout;
}

/** Имя и почта текущего пользователя; почту сервер менять пока не даёт. */
export function PersonalDataForm({ layout }: PersonalDataFormProps) {
  const inline = layout === "inline";
  const { data: user } = useGetCurrentUser();
  const { mutateAsync: update } = useUpdateUser();
  const { focused, setFocused, focusHandlers } = useFocusWithin();

  const initialUsername = user?.username ?? "";

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PersonalDataFormData>({
    defaultValues: { username: initialUsername },
    resolver: zodResolver(PersonalDataSchema),
    mode: "onTouched",
  });

  const username = useWatch({ control, name: "username" }) ?? "";

  useEffect(() => {
    reset({ username: initialUsername });
  }, [initialUsername, reset]);

  const submitHandler = async (data: PersonalDataFormData) => {
    if (data.username !== initialUsername) {
      try {
        await update({ username: data.username });
      } catch {
        return; // ошибку показал useUpdateUser
      }
    }
    setFocused(false);
  };

  const handleCancel = () => {
    reset({ username: initialUsername });
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
        <div className={styles.field}>
          <label htmlFor="username" className={labelClass}>
            {TEXTS.profile.usernameLabel}
          </label>
          <div className={styles.control}>
            <InputFieldMobile
              id="username"
              mode="text"
              {...register("username")}
              placeholder={TEXTS.profile.usernamePlaceholder}
              aria-invalid={!!errors.username}
              disabled={isSubmitting}
              autoComplete="name"
              hasError={!!errors.username}
              showSuffixButton={!inline && username.length > 0}
              onClean={() => setValue("username", "", { shouldDirty: true })}
            />
            {errors.username && <FormFieldError>{errors.username.message}</FormFieldError>}
          </div>
        </div>
        <EmailField email={user?.email ?? ""} labelClass={labelClass} withHint={!inline} />
      </div>
      <ProfileFormFooter
        layout={layout}
        focused={focused}
        dirty={isDirty}
        submitting={isSubmitting}
        submitText={TEXTS.save}
        onCancel={handleCancel}
      />
    </form>
  );
}

interface EmailFieldProps {
  email: string;
  labelClass: string;
  withHint: boolean;
}

function EmailField({ email, labelClass, withHint }: EmailFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor="email" className={labelClass}>
        {TEXTS.profile.emailLabel}
      </label>
      <div className={styles.control}>
        <InputFieldMobile id="email" type="email" mode="text" value={email} readOnly disabled />
        {withHint && (
          <span className={clsx("caption-reg", styles.hint)}>
            {TEXTS.profile.changeEmailDescription}
          </span>
        )}
      </div>
    </div>
  );
}
