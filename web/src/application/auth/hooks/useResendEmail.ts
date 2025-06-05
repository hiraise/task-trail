import { toast } from "sonner";
import { useDispatch } from "react-redux";

import { AppDispatch } from "@/infrastructure/redux/store";
import { resendVerificationThunk } from "../thunks/resendVerificationThunk";
import { AppError } from "@/shared/errors/types";

export const useResendEmail = (email: string) => {
  const dispatch = useDispatch<AppDispatch>();

  const resendEmail = async (): Promise<void> => {
    const thunk = resendVerificationThunk(email);
    try {
      await dispatch(thunk).unwrap();
      toast.success(
        `Письмо с подтверждением отправлено на ${email}. Проверьте папку "Спам"`
      );
    } catch (error: unknown) {
      toast.error(
        (error as AppError).message ??
          "Не удалось отправить письмо с подтверждением"
      );
    }
  };

  const openUserInbox = (): void => {
    const domain = email.split("@")[1]?.toLowerCase();

    if (domain === "gmail.com") {
      window.open("https://mail.google.com/mail/u/0/#inbox", "_blank");
    } else if (domain === "yandex.ru" || domain === "ya.ru") {
      window.open("https://mail.yandex.ru/", "_blank");
    } else if (
      domain === "mail.ru" ||
      domain === "inbox.ru" ||
      domain === "list.ru" ||
      domain === "bk.ru"
    ) {
      window.open("https://e.mail.ru/inbox/", "_blank");
    } else if (
      domain === "outlook.com" ||
      domain === "hotmail.com" ||
      domain === "live.com"
    ) {
      window.open("https://outlook.live.com/mail/inbox", "_blank");
    } else {
      // Fallback for other email providers
      window.location.href = `mailto:${email}`;
    }
  };

  return { resendEmail, openUserInbox };
};
