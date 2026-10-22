package app

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"time"

	"task-trail/config"
	"task-trail/internal/domain"
	"task-trail/internal/infrastructure/service/clock"
	"task-trail/internal/pkg/postgres"
	"task-trail/migrations"

	"github.com/gin-gonic/gin"
)

// Usage — команды сервера. Их запускает тот, кто управляет сервером, — тем же бинарником
// и с тем же окружением, что и сервер; вход в веб им не нужен.
const Usage = `Использование: app [команда]

Без команды — запустить сервер.

Команды:
  password-reset-link <почта>   напечатать ссылку сброса пароля пользователя (ADR-0017):
                                когда почта не подключена, а ни один администратор не может войти
`

// Command выполняет команду args и возвращает код выхода. Результат — в stdout, сообщения
// и ошибки — в stderr.
func Command(cfg *config.Config, args []string, stdout, stderr io.Writer) int {
	if len(args) == 2 && args[0] == "password-reset-link" {
		return passwordResetLink(cfg, args[1], stdout, stderr)
	}
	_, _ = fmt.Fprint(stderr, Usage)
	return 2
}

func passwordResetLink(cfg *config.Config, email string, stdout, stderr io.Writer) int {
	l := slog.New(slog.NewTextHandler(stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	// Сервер мог ещё не запускаться с этой версией: без миграций нет таблицы ссылок
	if err := postgres.Migrate(cfg.PG.ConnString, migrations.FS, l); err != nil {
		_, _ = fmt.Fprintf(stderr, "миграции: %v\n", err)
		return 1
	}
	pg, err := postgres.New(cfg.PG.ConnString, l)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "подключение к PostgreSQL: %v\n", err)
		return 1
	}
	defer pg.Close()
	// В режиме отладки gin печатает маршруты в stdout, а там должна быть только ссылка
	gin.SetMode(gin.ReleaseMode)
	server, err := New(pg.Pool, cfg, clock.New(), l)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "сборка сервера: %v\n", err)
		return 1
	}
	link, err := server.Access.PasswordResetLink.ForEmail(context.Background(), email)
	var e *domain.DomainError
	if errors.As(err, &e) && e.Code == domain.EntityNotFound {
		_, _ = fmt.Fprintf(stderr, "пользователя с почтой %s нет\n", email)
		return 1
	}
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "ссылка не создана: %v\n", err)
		return 1
	}
	_, _ = fmt.Fprintln(stdout, link.URL)
	_, _ = fmt.Fprintf(stderr, "Ссылка действует до %s и сработает один раз.\n", link.ExpiresAt.UTC().Format(time.DateTime+" MST"))
	return 0
}
