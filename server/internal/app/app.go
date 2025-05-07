package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/controller/http/middleware"
	"task-trail/internal/pkg/password"
	"task-trail/internal/repo"
	"task-trail/internal/usecase"

	"task-trail/pkg/logger"
	"task-trail/pkg/postgres"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	logger := logger.New(cfg.App.Debug)

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

	// init services
	pwdService := password.NewBcryptService()

	// init uc
	userUC := usecase.NewUserUC(txManager, userRepo, pwdService)

	// init http server
	httpServer := gin.Default()
	httpServer.Use(middleware.ErrorHandler())
	http.NewRouter(httpServer, logger, userUC)
	httpServer.Run()
}
