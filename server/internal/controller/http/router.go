package http

import (
	"log/slog"
	"net/http"
	v1 "task-trail/internal/controller/http/v1"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

func NewRouter(app *gin.Engine, l *slog.Logger, u usecase.Authentication) {
	v1.NewAuthenticationRouter(app, u, l)
	app.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "kek", "status": http.StatusOK})
	})
}
