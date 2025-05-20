//go:build integration

package repo

import (
	"context"
	"os"
	"strings"
	"task-trail/config"
	slogger "task-trail/internal/pkg/logger/slog"
	"task-trail/internal/pkg/postgres"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"
)

var pg *postgres.Postgres
var userRepo *PgUserRepository
var tokenRepo *PgTokenRepository
var txManager *PgTxManager

func TestMain(m *testing.M) {
	cfg, err := config.New()
	if err != nil {
		panic(err)
	}
	logger := slogger.New(cfg.App.Debug, true)
	cfg.PG.ConnString += "_test"

	dsn := cfg.PG.ConnString[:strings.LastIndex(cfg.PG.ConnString, "/")+1] + "postgres"
	if err := createTestDatabase(context.Background(), dsn, cfg.PG.ConnString[strings.LastIndex(cfg.PG.ConnString, "/")+1:]); err != nil {
		logger.Error("Test db creation failed", "error", err)
		os.Exit(1)
	}
	// migrate
	if cfg.PG.MigrationEnabled {
		if err := postgres.Migrate(cfg.PG.ConnString, cfg.PG.MigrationPath, logger); err != nil {
			logger.Error("db migration error", "error", err.Error())
			os.Exit(1)
		}
	}
	// init db
	opts := []postgres.Option{postgres.MaxPoolSize(cfg.PG.MaxPoolSize)}
	pg, err = postgres.New(cfg.PG.ConnString, logger, opts...)
	if err != nil {
		logger.Error("postgres connection error", "error", err.Error())
		os.Exit(1)
	}
	defer pg.Close()
	userRepo = NewUserRepo(pg.Pool)
	tokenRepo = NewTokenRepo(pg.Pool)
	txManager = NewPgTxManager(pg.Pool)
	os.Exit(m.Run())
}

func createTestDatabase(ctx context.Context, adminDSN, dbName string) error {
	conn, err := pgx.Connect(ctx, adminDSN)
	if err != nil {
		return err
	}
	defer conn.Close(ctx)

	_, err = conn.Exec(ctx, "DROP DATABASE IF EXISTS "+dbName)
	if err != nil {
		return err
	}

	_, err = conn.Exec(ctx, "CREATE DATABASE "+dbName)
	return err
}

func cleanDB(t *testing.T) {
	_, err := pg.Pool.Exec(context.Background(), `
		TRUNCATE TABLE users, refresh_tokens RESTART IDENTITY CASCADE;
	`)
	require.NoError(t, err)
}

// context with already rolled back tx for test db internal erorr handling
func getBadContext(t *testing.T) context.Context {
	tx, err := pg.Pool.Begin(t.Context())
	require.NoError(t, err)
	injectetedTx := injectTx(t.Context(), &tx)
	tx.Rollback(t.Context())
	return injectetedTx
}
