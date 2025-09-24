export const emailConfirmTexts = {
  title: "Подтвердите почту",
  subtitle: (email: string) => `
      Мы отправили письмо с подтверждением на ${email}.
      Перейдите по ссылке в письме, чтобы активировать ваш аккаунт.
    `,
  resendEmail: "Отправить повторно",
  openEmail: "Перейти в почту",
  imageAltText: "Email Confirmation",
  resendEmailTimerText: (time: string) => `Отправить новое письмо можно через ${time}`,
};
