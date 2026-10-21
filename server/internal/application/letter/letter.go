// Package letter — письма сервиса (ADR-0017): тема и текст. Сценарий собирает письмо
// и отправляет его через service.Mailer сразу в запросе.
package letter

import (
	"fmt"
	"time"

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
