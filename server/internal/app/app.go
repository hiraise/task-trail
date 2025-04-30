package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/repo/db/postgresql"
	"task-trail/internal/usecase/authentication"
	"task-trail/pkg/logger"
	"task-trail/pkg/postgres"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	logger := logger.New(cfg.App.Debug)
	// Init pg

	// Init repo
	opts := []postgres.Option{postgres.MaxPoolSize(cfg.PG.MaxPoolSize)}
	pg, err := postgres.New(cfg.PG.ConnString, logger, opts...)
	if err != nil {
		logger.Error("postgres connection error", "raw_error", err.Error())
		os.Exit(1)
	}
	defer pg.Close()

	_ = pg
	authRepo := postgresql.New()
	authUsecase := authentication.New(authRepo)

	httpServer := gin.Default()
	http.NewRouter(httpServer, logger, authUsecase)
	httpServer.Run()
}
