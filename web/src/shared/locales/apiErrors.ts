import type { ApiErrorCode } from "../errors/types";

// User-facing texts by API error code. The response `message` is for logs; we do not show it
// (ADR-0018). If a code is not listed, the screen shows its own error text.
export const apiErrorTexts: Partial<Record<ApiErrorCode, string>> = {
  INVALID_CREDENTIALS: "Неверная почта или пароль",
  FORBIDDEN: "Недостаточно прав для этого действия",
  NOT_FOUND: "Не найдено или нет доступа",
  REGISTRATION_CLOSED: "Первый аккаунт уже создан — войдите",
  WRONG_PASSWORD: "Неверный текущий пароль",
  PASSWORD_SAME_AS_OLD: "Новый пароль совпадает с текущим",
  LINK_INVALID: "Ссылка недействительна или устарела",
  INVITATION_ACCEPTED: "Аккаунт с этой почтой уже есть — войдите",
  ASSIGNEE_NOT_MEMBER: "Ответственный должен быть участником проекта",
  OWNER_CANNOT_LEAVE: "Владелец не может уйти — проект или доску можно только удалить",
  LAST_ADMIN: "Нельзя снять последнего администратора сервиса",
  PROJECT_KEY_TAKEN: "Этот ключ уже занят другим проектом",
  TASK_ARCHIVED: "Задача в архиве — её нельзя менять",
  PROJECT_ARCHIVED: "Проект в архиве — его нельзя менять",
  TASK_PARENT_INVALID: "Подзадачей может быть задача того же проекта без своих подзадач, а родитель — не подзадача",
  BOARD_PROJECT_UNAVAILABLE: "Проект недоступен: на доску можно добавить только свой проект",
  BOARD_MEMBER_UNAVAILABLE:
    "Пользователь недоступен: добавить можно только того, с кем у вас есть общий проект",
  LABEL_NAME_TAKEN: "Метка с таким названием уже есть в проекте",
  LABEL_UNAVAILABLE: "Метка не найдена в проекте задачи — обновите страницу",
  COMMENT_EDIT_EXPIRED: "Комментарий можно изменить только в первые 24 часа",
  FILE_TOO_LARGE: "Файл больше 5 МБ",
  FILE_TYPE_NOT_ALLOWED: "Подходят только изображения JPEG, PNG и WebP",
  // MAIL_DISABLED and MAIL_SEND_FAILED address whoever requests a password reset email; the admin's
  // test email shows its own texts (features/admin/hooks/useSendTestMail.ts)
  MAIL_DISABLED: "Почта не подключена: ссылку для сброса пароля выдаёт администратор сервиса",
  MAIL_SEND_FAILED: "Не удалось отправить письмо. Попробуйте позже",
  MAIL_CONNECTION_FAILED:
    "Не удалось подключиться к SMTP-серверу: проверьте сервер, порт, шифрование, логин, пароль и отправителя. Настройки не сохранены",
  SECRET_REQUIRED: "Введите пароль SMTP заново: сменился сервер или порт либо пароль не сохранён",
};
