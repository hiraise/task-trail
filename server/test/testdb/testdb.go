// Package testdb gives repository integration tests (ADR-0007) a clean PostgreSQL database
// with migrations. The server address is TEST_PG_URL: scripts/dev.sh server starts a
// temporary PostgreSQL in Docker for it.
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

// New creates a separate database per test, applies migrations and drops the database after the test.
// Without TEST_PG_URL the test is skipped, and in CI it fails: integration tests are mandatory there.
func New(t testing.TB) *pgxpool.Pool {
	t.Helper()
	server := os.Getenv("TEST_PG_URL")
	if server == "" {
		if os.Getenv("CI") != "" {
			t.Fatal("TEST_PG_URL is not set: integration tests are mandatory in CI")
		}
		t.Skip("TEST_PG_URL is not set: integration tests are run by scripts/dev.sh server")
	}
	ctx := context.Background()
	admin, err := pgx.Connect(ctx, server)
	if err != nil {
		t.Fatalf("connecting to %s: %v", server, err)
	}
	t.Cleanup(func() { _ = admin.Close(ctx) })

	name := "test_" + randomSuffix(t)
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+pgx.Identifier{name}.Sanitize()); err != nil {
		t.Fatalf("creating the database: %v", err)
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
		t.Fatalf("migrations: %v", err)
	}
	pool, err := pgxpool.New(ctx, u.String())
	if err != nil {
		t.Fatalf("connection pool: %v", err)
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
