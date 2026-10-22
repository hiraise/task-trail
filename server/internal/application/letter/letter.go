// Package letter — письма сервиса (ADR-0017): тема и текст. Сценарий собирает письмо
// и отправляет его через service.Mailer сразу в запросе.
package letter

import (
	"fmt"
	"strings"
	"time"
	"unicode"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

// PasswordReset — письмо со ссылкой сброса пароля; lifetime — сколько ссылка действует.
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

// Invitation — приглашение в проект почты без аккаунта (ADR-0016): по ссылке человек
// задаёт имя и пароль. inviter — имя пригласившего, а если его нет — почта.
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

// AddedToProject — извещение человеку с аккаунтом, которого сразу добавили в проект (ADR-0017).
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

// MailTest — тестовое письмо администратору: почта подключена и письма доходят (ADR-0017).
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

// oneLine заменяет переводы строк и другие управляющие символы пробелами: тема письма —
// одна строка заголовка.
func oneLine(s string) string {
	return strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return ' '
		}
		return r
	}, s)
}

// Duration называет срок по-русски: до двух суток — в часах («24 часа»), дольше — в днях
// («7 дней»). Остаток меньше часа или дня отбрасывается.
func Duration(d time.Duration) string {
	if d < 48*time.Hour {
		hours := int(d / time.Hour)
		return fmt.Sprintf("%d %s", hours, plural(hours, "час", "часа", "часов"))
	}
	days := int(d / (24 * time.Hour))
	return fmt.Sprintf("%d %s", days, plural(days, "день", "дня", "дней"))
}

// plural выбирает форму слова для числа n: 1 час, 2 часа, 5 часов, 21 час, 11 часов.
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
