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

// Usage — server commands. They are run by whoever manages the server — with the same binary
// and the same environment as the server; they do not need to sign in to the web.
const Usage = `Usage: app [command]

Without a command — start the server.

Commands:
  password-reset-link <email>   print a user's password reset link (ADR-0017):
                                when mail is not connected and no administrator can sign in
`

// Command runs the command args and returns the exit code. The result goes to stdout, messages
// and errors — to stderr.
func Command(cfg *config.Config, args []string, stdout, stderr io.Writer) int {
	if len(args) == 2 && args[0] == "password-reset-link" {
		return passwordResetLink(cfg, args[1], stdout, stderr)
	}
	_, _ = fmt.Fprint(stderr, Usage)
	return 2
}

func passwordResetLink(cfg *config.Config, email string, stdout, stderr io.Writer) int {
	l := slog.New(slog.NewTextHandler(stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	// The server may not have run with this version yet: without migrations there is no links table
	if err := postgres.Migrate(cfg.PG.ConnString, migrations.FS, l); err != nil {
		_, _ = fmt.Fprintf(stderr, "migrations: %v\n", err)
		return 1
	}
	pg, err := postgres.New(cfg.PG.ConnString, l)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "connecting to PostgreSQL: %v\n", err)
		return 1
	}
	defer pg.Close()
	// In debug mode gin prints routes to stdout, and only the link must be there
	gin.SetMode(gin.ReleaseMode)
	server, err := New(pg.Pool, cfg, clock.New(), l)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "building the server: %v\n", err)
		return 1
	}
	link, err := server.Access.PasswordResetLink.ForEmail(context.Background(), email)
	var e *domain.DomainError
	if errors.As(err, &e) && e.Code == domain.EntityNotFound {
		_, _ = fmt.Fprintf(stderr, "no user with email %s\n", email)
		return 1
	}
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "link not created: %v\n", err)
		return 1
	}
	_, _ = fmt.Fprintln(stdout, link.URL)
	_, _ = fmt.Fprintf(stderr, "The link is valid until %s and works once.\n", link.ExpiresAt.UTC().Format(time.DateTime+" MST"))
	return 0
}
