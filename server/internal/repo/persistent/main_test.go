//go:build integration

package persistent

import (
	"context"
	"os"
	"strings"
	"task-trail/config"
	slogger "task-trail/internal/pkg/logger/slog"
	"task-trail/internal/pkg/postgres"
	"task-trail/internal/usecase/dto"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"
)

const testEmail = "test@mail.com"
const testEmail1 = "test1@mail.com"
const testEmail2 = "test2@mail.com"

var pg *postgres.Postgres
var txManager *PgTxManager
var userRepo *PgUserRepository
var tokenRepo *PgRefreshTokenRepository
var emailTokenRepo *PgEmailTokenRepository
var projectRepo *PgProjectRepository

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
	txManager = NewPgTxManager(pg.Pool)
	userRepo = NewUserRepo(pg.Pool)
	tokenRepo = NewRefreshTokenRepo(pg.Pool)
	emailTokenRepo = NewEmailTokenRepo(pg.Pool)
	projectRepo = NewProjectRepo(pg.Pool)
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
		TRUNCATE TABLE 
		users, 
		refresh_tokens, 
		email_tokens,
		project_users,
		projects,
		files,
		tasks
		RESTART IDENTITY CASCADE;
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

func addUser(ctx context.Context, email string) (int, error) {
	return userRepo.Create(ctx, &dto.UserCreate{Email: email, PasswordHash: "123", IsVerified: true})
}

func mustAddUser(t *testing.T, email string) int {
	id, err := addUser(t.Context(), email)
	require.NoError(t, err)
	return id
}
