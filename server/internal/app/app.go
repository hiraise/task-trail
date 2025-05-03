package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/repo"

	"task-trail/internal/usecase/registration"
	"task-trail/pkg/logger"
	"task-trail/pkg/postgres"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	logger := logger.New(cfg.App.Debug)

	// Init db
	opts := []postgres.Option{postgres.MaxPoolSize(cfg.PG.MaxPoolSize)}
	pg, err := postgres.New(cfg.PG.ConnString, logger, opts...)
	if err != nil {
		logger.Error("postgres connection error", "raw_error", err.Error())
		os.Exit(1)
	}
	defer pg.Close()

	// Init repo layer
	txManager := repo.NewPgTxManager(pg.Pool)
	userRepo := repo.NewUserRepo(pg.Pool)

	registrationUC := registration.New(txManager, userRepo)
	httpServer := gin.Default()
	http.NewRouter(httpServer, logger, registrationUC)
	httpServer.Run()
}
