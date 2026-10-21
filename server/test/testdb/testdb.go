// Package testdb даёт интеграционным тестам репозиториев (ADR-0007) чистую базу PostgreSQL
// с миграциями. Адрес сервера — TEST_PG_URL: scripts/dev.sh server поднимает для него
// временный PostgreSQL в Docker.
package testdb

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/url"
	"os"
	"testing"

	"task-trail/internal/pkg/postgres"
	"task-trail/migrations"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type nopLogger struct{}

func (nopLogger) Debug(string, ...any) {}
func (nopLogger) Info(string, ...any)  {}
func (nopLogger) Warn(string, ...any)  {}
func (nopLogger) Error(string, ...any) {}

// New создаёт отдельную базу на тест, применяет миграции и удаляет базу после теста.
// Без TEST_PG_URL тест пропускается, а в CI — падает: там интеграционные тесты обязательны.
func New(t testing.TB) *pgxpool.Pool {
	t.Helper()
	server := os.Getenv("TEST_PG_URL")
	if server == "" {
		if os.Getenv("CI") != "" {
			t.Fatal("TEST_PG_URL не задан: в CI интеграционные тесты обязательны")
		}
		t.Skip("TEST_PG_URL не задан: интеграционные тесты запускает scripts/dev.sh server")
	}
	ctx := context.Background()
	admin, err := pgx.Connect(ctx, server)
	if err != nil {
		t.Fatalf("подключение к %s: %v", server, err)
	}
	t.Cleanup(func() { _ = admin.Close(ctx) })

	name := "test_" + randomSuffix(t)
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+pgx.Identifier{name}.Sanitize()); err != nil {
		t.Fatalf("создание базы: %v", err)
	}
	t.Cleanup(func() {
		_, _ = admin.Exec(ctx, "DROP DATABASE "+pgx.Identifier{name}.Sanitize()+" WITH (FORCE)")
	})

	u, err := url.Parse(server)
	if err != nil {
		t.Fatalf("TEST_PG_URL: %v", err)
	}
	u.Path = "/" + name
	if err := postgres.Migrate(u.String(), migrations.FS, nopLogger{}); err != nil {
		t.Fatalf("миграции: %v", err)
	}
	pool, err := pgxpool.New(ctx, u.String())
	if err != nil {
		t.Fatalf("пул соединений: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func randomSuffix(t testing.TB) string {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		t.Fatal(err)
	}
	return hex.EncodeToString(b)
}
