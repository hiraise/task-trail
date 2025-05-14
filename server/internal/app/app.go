package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/controller/http/middleware"
	"task-trail/internal/pkg/password"
	"task-trail/internal/pkg/token"
	"task-trail/internal/pkg/uuid"
	"task-trail/internal/repo"
	"task-trail/internal/usecase"

	slogger "task-trail/pkg/logger/slog"
	"task-trail/pkg/postgres"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	logger := slogger.New(cfg.App.Debug, true)
	logger1 := slogger.New(cfg.App.Debug, false)
	// migrate
	if cfg.PG.MigrationEnabled {
		if err := postgres.Migrate(cfg.PG.ConnString, logger); err != nil {
			logger.Error("db migration error", "raw_error", err.Error())
			os.Exit(1)
		}
	}
	// init db
	opts := []postgres.Option{postgres.MaxPoolSize(cfg.PG.MaxPoolSize)}
	pg, err := postgres.New(cfg.PG.ConnString, logger, opts...)
	if err != nil {
		logger.Error("postgres connection error", "raw_error", err.Error())
		os.Exit(1)
	}
	defer pg.Close()

	// init repo
	txManager := repo.NewPgTxManager(pg.Pool)
	userRepo := repo.NewUserRepo(pg.Pool)
	tokenRepo := repo.NewTokenRepo(pg.Pool)

	// init services
	pwdService := password.NewBcryptService()
	uuidGenerator := &uuid.UUIDGenerator{}
	tokenService := token.NewJwtService(
		cfg.AUTH.AccessTokenSecret,
		cfg.AUTH.AccessTokenLifetimeMin,
		cfg.AUTH.RefreshTokenSecret,
		cfg.AUTH.RefreshTokenLifetimeMin,
		cfg.AUTH.TokenIssuer,
		uuidGenerator)

	// init uc
	userUC := usecase.NewUserUC(txManager, userRepo, pwdService)
	authUC := usecase.NewAuthUC(logger, txManager, userRepo, tokenRepo, pwdService, tokenService)

	// init middlewares

	recoveryMW := middleware.RecoveryWithLogger(logger1)
	logMW := middleware.CustomLogger(logger1)
	authMW := middleware.AuthHandler(tokenService, logger)
	// init http server
	httpServer := gin.New()
	httpServer.Use(logMW)
	httpServer.Use(recoveryMW)
	httpServer.Use(middleware.ErrorHandler(logger1))
	http.NewRouter(httpServer, logger, userUC, authUC, authMW, cfg)
	httpServer.Run()
}
