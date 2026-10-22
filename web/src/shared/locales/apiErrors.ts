import type { ApiErrorCode } from "../errors/types";

// Тексты для пользователя по коду ошибки API. `message` из ответа — для логов, его не показываем
// (ADR-0018). Кода нет в списке — экран показывает свой текст ошибки.
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
  OWNER_CANNOT_LEAVE: "Владелец не может покинуть проект — его можно только удалить",
  FILE_TOO_LARGE: "Файл больше 5 МБ",
  FILE_TYPE_NOT_ALLOWED: "Подходят только изображения JPEG, PNG и WebP",
  MAIL_DISABLED: "Почта не подключена: ссылку для сброса пароля выдаёт администратор сервиса",
  MAIL_SEND_FAILED: "Не удалось отправить письмо. Попробуйте позже",
};
