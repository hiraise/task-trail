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

/** Ошибку сохранения, которая относится к полю, показываем под полем, а не тостом. */
function showFieldErrors(error: unknown, setError: UseFormSetError<FormValues>) {
  if (hasErrorCode(error, "SECRET_REQUIRED")) {
    setError("password", { message: adminTexts.mail.passwordRequired }, { shouldFocus: true });

    return;
  }
  // VALIDATION_FAILED: ключи details — поля запроса (ADR-0018)
  if (!(error instanceof AppError) || !error.details) return;
  for (const name of FIELD_NAMES) {
    const message = error.details[name];

    if (message) setError(name, { message });
  }
}

/**
 * Состояние формы почты: значения из сохранённых настроек, сохранение с проверкой подключения
 * на сервере. На отдельной странице после сохранения — назад в раздел.
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

      return; // остальное показал useSaveMailSettings
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
