import { useState } from "react";
import { toast } from "sonner";

export const useEmailConfirm = (email: string) => {
  const [loading, setLoading] = useState(false);

  const resendEmail = async (): Promise<void> => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(
        `Письмо с подтверждением отправлено на ${email}. Проверьте папку "Спам"`
      );
    } catch (error) {
      toast.error(
        "Не удалось отправить письмо с подтверждением. Попробуйте еще раз."
      );
      console.error("Error sending confirmation email:", error);
    } finally {
      setLoading(false);
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

  return { resendEmail, openUserInbox, loading };
};
