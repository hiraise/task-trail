// Package letter holds the service emails (ADR-0017): subject and text. A use case builds an email
// and sends it via service.Mailer within the request.
package letter

import (
	"fmt"
	"strings"
	"time"
	"unicode"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

// PasswordReset is an email with a password reset link; lifetime is how long the link is valid.
func PasswordReset(to entity.Email, link string, lifetime time.Duration) service.Letter {
	return service.Letter{
		To:      to,
		Subject: "Сброс пароля в TaskTrail",
		Text: fmt.Sprintf(`Здравствуйте!

Для аккаунта %s в TaskTrail запросили сброс пароля. Чтобы задать новый пароль, откройте ссылку:

%s

Ссылка действует %s и сработает один раз. После сброса войдите заново на всех устройствах.

Если вы не запрашивали сброс, ничего не делайте: пароль останется прежним.
`, to, link, Duration(lifetime)),
	}
}

// Invitation invites an email without an account to a project (ADR-0016): via the link the person
// sets a name and password. inviter is the inviter's name, or their email if there is no name.
func Invitation(to entity.Email, inviter, project, link string, lifetime time.Duration) service.Letter {
	return service.Letter{
		To:      to,
		Subject: fmt.Sprintf("Приглашение в проект «%s» в TaskTrail", oneLine(project)),
		Text: fmt.Sprintf(`Здравствуйте!

%s приглашает вас в проект «%s» в TaskTrail — трекере задач команды. Чтобы принять
приглашение, откройте ссылку, задайте имя и пароль:

%s

Ссылка действует %s. Если вы не ждали приглашения, ничего не делайте.
`, inviter, project, link, Duration(lifetime)),
	}
}

// AddedToProject notifies a person with an account who was added to a project right away (ADR-0017).
func AddedToProject(to entity.Email, inviter, project, link string) service.Letter {
	return service.Letter{
		To:      to,
		Subject: fmt.Sprintf("Вас добавили в проект «%s» в TaskTrail", oneLine(project)),
		Text: fmt.Sprintf(`Здравствуйте!

%s добавляет вас в проект «%s» в TaskTrail. Проект откроется по ссылке:

%s
`, inviter, project, link),
	}
}

// MailTest is a test email to the administrator: mail is configured and emails are delivered (ADR-0017).
func MailTest(to entity.Email) service.Letter {
	return service.Letter{
		To:      to,
		Subject: "Проверка почты TaskTrail",
		Text: `Здравствуйте!

Это тестовое письмо TaskTrail. Раз оно дошло, почта настроена: с этого адреса будут
уходить ссылки сброса пароля и приглашения в проекты.
`,
	}
}

// TaskNotificationData — what a notification email says. FromStatus and ToStatus are status names,
// DueDate is DD.MM.YYYY, Actor is empty for reminders.
type TaskNotificationData struct {
	Kind                 entity.NotificationKind
	TaskKey, TaskName    string
	Actor                string
	FromStatus, ToStatus string
	Text, DueDate        string
	TaskURL, ProfileURL  string
}

// TaskNotification repeats a notification by email (ADR-0038): the subject names the task key and
// what happened; a comment's start follows in the text.
func TaskNotification(to entity.Email, n TaskNotificationData) service.Letter {
	var event string
	switch n.Kind {
	case entity.NotifyAssigned:
		event = n.Actor + " назначил(а) вас ответственным"
	case entity.NotifyStatusChanged:
		event = fmt.Sprintf("%s изменил(а) статус: %s → %s", n.Actor, n.FromStatus, n.ToStatus)
	case entity.NotifyCommented:
		event = n.Actor + " оставил(а) комментарий"
	case entity.NotifyMentioned:
		event = n.Actor + " упомянул(а) вас в комментарии"
	case entity.NotifyDueSoon:
		event = "Срок задачи — завтра, " + n.DueDate
	case entity.NotifyOverdue:
		event = "Срок задачи прошёл " + n.DueDate
	default:
		event = "Новое уведомление"
	}
	var text strings.Builder
	text.WriteString("Здравствуйте!\n\n" + event + "\n")
	if n.Text != "" && (n.Kind == entity.NotifyCommented || n.Kind == entity.NotifyMentioned) {
		text.WriteString("\n«" + n.Text + "»\n")
	}
	fmt.Fprintf(&text, "\nЗадача: %s %s\n%s\n\nПисьма об уведомлениях отключаются в профиле: %s\n",
		n.TaskKey, n.TaskName, n.TaskURL, n.ProfileURL)
	return service.Letter{
		To:      to,
		Subject: oneLine(n.TaskKey + ": " + event),
		Text:    text.String(),
	}
}

// oneLine replaces line breaks and other control characters with spaces: an email subject is
// a single header line.
func oneLine(s string) string {
	return strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return ' '
		}
		return r
	}, s)
}

// Duration names a period in Russian: under two days in hours ("24 hours"), longer in days
// ("7 days"). A remainder under an hour or a day is dropped.
func Duration(d time.Duration) string {
	if d < 48*time.Hour {
		hours := int(d / time.Hour)
		return fmt.Sprintf("%d %s", hours, plural(hours, "час", "часа", "часов"))
	}
	days := int(d / (24 * time.Hour))
	return fmt.Sprintf("%d %s", days, plural(days, "день", "дня", "дней"))
}

// plural picks the Russian word form for n: one for 1, 21, 31; few for 2-4, 22-24; many otherwise, including 11-14.
func plural(n int, one, few, many string) string {
	switch n10, n100 := n%10, n%100; {
	case n10 == 1 && n100 != 11:
		return one
	case n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14):
		return few
	default:
		return many
	}
}
