const EMAIL_PROVIDERS = {
  "gmail.com": "https://mail.google.com/mail/u/0/#inbox",
  "yandex.ru": "https://mail.yandex.ru/",
  "ya.ru": "https://mail.yandex.ru/",
  "mail.ru": "https://e.mail.ru/inbox/",
  "inbox.ru": "https://e.mail.ru/inbox/",
  "list.ru": "https://e.mail.ru/inbox/",
  "bk.ru": "https://e.mail.ru/inbox/",
  "outlook.com": "https://outlook.live.com/mail/inbox",
  "hotmail.com": "https://outlook.live.com/mail/inbox",
  "live.com": "https://outlook.live.com/mail/inbox",
} as const;

export const openUserInbox = (email: string): void => {
  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain) {
    window.location.href = `mailto:${email}`;

    return;
  }

  const providerUrl = EMAIL_PROVIDERS[domain as keyof typeof EMAIL_PROVIDERS];

  if (providerUrl) {
    window.open(providerUrl, "_blank");
  } else {
    window.location.href = `mailto:${email}`;
  }
};
