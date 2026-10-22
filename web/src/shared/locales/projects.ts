import type { ProjectRole } from "@/domain/types";

export const projectsTexts = {
  projectNamePlaceholder: "Название проекта",
  projectDescriptionPlaceholder: "Описание проекта",
  keyLabel: "Ключ",
  keyPlaceholder: "Ключ, например DS",
  keyHint: "Задачи получат ключи {key}-1, {key}-2…",
  keyChangeHint: "Ключи задач изменятся: {old}-12 станет {new}-12",
  createProject: "Создать проект",
  creatingProject: "Создание проекта...",
  userNotFound:
    "Пользователя нет в участниках ваших проектов. Добавьте адрес его электронной почты, чтобы пригласить",
  noCandidates:
    "Здесь появятся люди из ваших проектов. Чтобы позвать нового человека, введите его почту",
  inviteMembersPlaceHolder: "Введите Email или имя пользователя",
  tooManyEmails: "За раз можно позвать до 50 человек",

  roles: {
    owner: "Владелец проекта",
    admin: "Администратор",
    member: "Участник",
  } satisfies Record<ProjectRole, string>,
  inviteHint:
    "Если у человека ещё нет аккаунта TaskTrail, ему придёт письмо со ссылкой приглашения в проект",
  inviteHintNoMail:
    "Если у человека ещё нет аккаунта TaskTrail, вы получите ссылку приглашения — отправьте её сами: почта сервиса не подключена",

  projectCreated: "Проект создан",
  createProjectFailed: "Не удалось создать проект",
  projectUpdated: "Проект сохранён",
  updateProjectFailed: "Не удалось сохранить проект",
  projectDeleted: "Проект удалён",
  deleteProjectFailed: "Не удалось удалить проект",
  projectLeft: "Вы покинули проект",
  leaveProjectFailed: "Не удалось покинуть проект",
  inviteFailed: "Не удалось пригласить участников",
  memberRemoved: "Участник удалён из проекта",
  removeMemberFailed: "Не удалось удалить участника",
  madeAdmin: "{name} теперь администратор",
  madeMember: "{name} больше не администратор",
  changeRoleFailed: "Не удалось сменить роль",
  removeAdmin: "Убрать из администраторов",

  // Invitation result per email (InvitationResult, ADR-0017)
  invitations: {
    title: "Приглашения",
    added: "Добавлен в проект",
    invited: "Приглашение отправлено",
    invitedNoMail: "Ссылка приглашения",
    alreadyMember: "Уже в проекте",
    mailFailed: "Письмо не ушло",
    noMailHint:
      "Почта сервиса не подключена — отправьте ссылки приглашённым сами. Ссылка действует 7 дней.",
    mailFailedHint: "Приглашение создано, но письмо не ушло. Пригласите снова — уйдёт новое письмо.",
    copyLink: "Скопировать",
    linkCopied: "Ссылка скопирована",
    copyFailed: "Не удалось скопировать — выделите ссылку и скопируйте вручную",
    inviteAgain: "Пригласить снова",
    done: "Готово",
    summaryAdded: "Добавлены в проект: {count}",
    summaryInvited: "Приглашения отправлены: {count}",
    summaryAlreadyMember: "Уже в проекте: {count}",
  },
};
