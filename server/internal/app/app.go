package app

import (
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/logger"
	"task-trail/internal/repo/db/postgresql"
	"task-trail/internal/usecase/authentication"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	logger := logger.New(cfg.App.Debug)

	// Init pg

	// Init repo

	authRepo := postgresql.New()
	authUsecase := authentication.New(authRepo)

	httpServer := gin.Default()
	http.NewRouter(httpServer, logger, authUsecase)
	httpServer.Run()
}
