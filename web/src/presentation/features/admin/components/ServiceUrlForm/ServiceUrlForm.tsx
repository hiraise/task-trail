import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, InputFieldMobile } from "@/presentation/shared";
import {
  FormFooter,
  formClassName,
  type FormLayout,
  formStyles as styles,
  labelClassName,
  useFocusWithin,
} from "@/presentation/shared/forms/FormLayout";
import { ROUTES } from "@/shared/config/routes";
import { adminTexts } from "@/shared/locales/admin";
import { TEXTS } from "@/shared/locales/texts";

import { useServiceSettings, useUpdateServiceUrl } from "../../hooks";

import { schema, type FormValues } from "./schema";

const texts = adminTexts.serviceUrl;

/** Service URL: in the section card with "Cancel" and "Save", on a phone as a page. */
export function ServiceUrlForm({ layout }: { layout: FormLayout }) {
  const inline = layout === "inline";
  const navigate = useNavigate();
  const { data: settings } = useServiceSettings();
  const { mutateAsync: update } = useUpdateServiceUrl();
  const { focused, setFocused, focusHandlers } = useFocusWithin();
  const initial = settings?.serviceUrl ?? "";

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: { serviceUrl: initial },
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const value = useWatch({ control, name: "serviceUrl" }) ?? "";

  useEffect(() => {
    reset({ serviceUrl: initial });
  }, [initial, reset]);

  const submitHandler = async (data: FormValues) => {
    try {
      await update({ serviceUrl: data.serviceUrl });
    } catch {
      return; // useUpdateServiceUrl has shown the error
    }
    if (!inline) {
      navigate({ to: ROUTES.admin });

      return;
    }
    setFocused(false);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const handleCancel = () => {
    reset({ serviceUrl: initial });
    setFocused(false);
  };

  return (
    <form
      className={formClassName(layout)}
      onSubmit={handleSubmit(submitHandler)}
      {...(inline ? focusHandlers : {})}
    >
      <div className={clsx(styles.field)}>
        <label htmlFor="serviceUrl" className={labelClassName(layout)}>
          {texts.label}
        </label>
        <div className={styles.control}>
          <InputFieldMobile
            id="serviceUrl"
            mode="text"
            type="url"
            inputMode="url"
            {...register("serviceUrl")}
            placeholder={texts.placeholder}
            aria-invalid={!!errors.serviceUrl}
            disabled={isSubmitting}
            autoComplete="off"
            hasError={!!errors.serviceUrl}
            showSuffixButton={!inline && value.length > 0}
            onClean={() => setValue("serviceUrl", "", { shouldDirty: true })}
          />
          {errors.serviceUrl && <FormFieldError>{errors.serviceUrl.message}</FormFieldError>}
          {!inline && (
            <span className={clsx("body-reg-2", styles.hint)}>{texts.description}</span>
          )}
        </div>
      </div>
      <FormFooter
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
