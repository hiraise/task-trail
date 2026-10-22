import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";

import { ROUTES } from "@/shared/config/routes";
import { AppError, hasErrorCode } from "@/shared/errors/types";
import { adminTexts } from "@/shared/locales/admin";

import { useSaveMailSettings, useServiceSettings } from "../../hooks";

import { schema, toFormValues, toNewMailSettings, type FormValues } from "./schema";

const FIELD_NAMES = ["host", "port", "encryption", "sender", "username", "password"] as const;

/** A save error that belongs to a field is shown under the field, not as a toast. */
function showFieldErrors(error: unknown, setError: UseFormSetError<FormValues>) {
  if (hasErrorCode(error, "SECRET_REQUIRED")) {
    setError("password", { message: adminTexts.mail.passwordRequired }, { shouldFocus: true });

    return;
  }
  // VALIDATION_FAILED: `details` keys are request fields (ADR-0018)
  if (!(error instanceof AppError) || !error.details) return;
  for (const name of FIELD_NAMES) {
    const message = error.details[name];

    if (message) setError(name, { message });
  }
}

/**
 * Mail form state: values from the saved settings, saving with a connection check
 * on the server. On a separate page, back to the section after saving.
 */
export function useMailForm(inline: boolean) {
  const navigate = useNavigate();
  const { data: settings } = useServiceSettings();
  const mail = settings?.mail;
  const { mutateAsync: save } = useSaveMailSettings();

  const form = useForm<FormValues>({
    defaultValues: toFormValues(mail),
    resolver: zodResolver(schema),
    mode: "onTouched",
  });
  const { reset, setError } = form;

  useEffect(() => {
    reset(toFormValues(mail));
  }, [mail, reset]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await save(toNewMailSettings(values));
    } catch (error) {
      showFieldErrors(error, setError);

      return; // useSaveMailSettings has shown the rest
    }
    if (!inline) {
      navigate({ to: ROUTES.admin });

      return;
    }
    (document.activeElement as HTMLElement | null)?.blur();
  });

  const cancel = () => reset(toFormValues(mail));

  return { form, mail, submit, cancel };
}
