// Notification texts (ADR-0038, stage 3 plan, step 14)
export const notificationsTexts = {
  title: "Уведомления",
  readAll: "Прочитать все",
  empty: "Уведомлений пока нет",
  loadFailed: "Не удалось загрузить уведомления",
  loading: "Загружаем уведомления",
  unread: "Не прочитано",
  unreadCount: "{count} непрочитанных",
  // `{actor}` is rendered in bold by NotificationItem: keep it at the start of the sentence
  kinds: {
    assigned: "{actor} назначил(а) вас ответственным",
    status_changed: "{actor} изменил(а) статус: {from} → {to}",
    commented: "{actor} оставил(а) комментарий",
    mentioned: "{actor} упомянул(а) вас",
    due_soon: "Срок завтра, {date}",
    overdue: "Срок прошёл {date}",
  },
  emailSwitch: "Письма об уведомлениях",
  emailHint: "Письмо придёт, если уведомление не прочитано 5 минут",
  mailDisabled: "Почта не подключена администратором — письма не приходят",
  emailSaveFailed: "Не удалось сохранить настройку",
};
