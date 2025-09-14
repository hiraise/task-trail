export const openUserInbox = (email: string): void => {
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
  } else if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com") {
    window.open("https://outlook.live.com/mail/inbox", "_blank");
  } else {
    // Fallback for other email providers
    window.location.href = `mailto:${email}`;
  }
};
