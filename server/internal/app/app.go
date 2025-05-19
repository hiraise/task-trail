package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/controller/http/middleware"
	"task-trail/internal/customerrors"
	authuc "task-trail/internal/usecase/auth"
	useruc "task-trail/internal/usecase/user"

	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/password/bcrypt"
	"task-trail/internal/pkg/token/jwt"
	"task-trail/internal/pkg/uuid/guuid"

	"task-trail/internal/repo"

	slogger "task-trail/internal/pkg/logger/slog"
	"task-trail/internal/pkg/postgres"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	// TODO: run background gorutine and break when app is down
	logger := slogger.New(cfg.App.Debug, true)
	logger1 := slogger.New(cfg.App.Debug, false)
	// migrate
	if cfg.PG.MigrationEnabled {
		if err := postgres.Migrate(cfg.PG.ConnString, cfg.PG.MigrationPath, logger); err != nil {
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
	pwdService := bcrypt.New()
	uuidGenerator := guuid.New()
	tokenService := jwt.New(
		cfg.AUTH.ATSecret,
		cfg.AUTH.ATLifeMin,
		cfg.AUTH.RTSecret,
		cfg.AUTH.RTLifeMin,
		cfg.AUTH.TokenIssuer,
		uuidGenerator)
	errHandler := customerrors.NewErrHander()
	contextm := contextmanager.NewGin(uuidGenerator)
	// init uc
	userUC := useruc.New(txManager, userRepo, pwdService)
	authUC := authuc.New(errHandler, txManager, userRepo, tokenRepo, pwdService, tokenService)

	// init middlewares

	recoveryMW := middleware.NewRecovery(logger1, contextm)
	requestMW := middleware.NewRequest(contextm)
	logMW := middleware.NewLog(logger1, contextm)
	authMW := middleware.NewAuth(tokenService, errHandler, contextm, cfg.AUTH.ATName)
	errorMW := middleware.NewError(logger1, contextm)
	// init http server
	httpServer := gin.New()
	httpServer.Use(requestMW)
	httpServer.Use(logMW)
	httpServer.Use(recoveryMW)
	httpServer.Use(errorMW)
	http.NewRouter(httpServer, errHandler, contextm, userUC, authUC, authMW, cfg)
	httpServer.Run()
}
