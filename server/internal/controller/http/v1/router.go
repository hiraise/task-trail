package v1

import (
	"log/slog"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

func NewRouter(router *gin.Engine, userUC usecase.User, authUC usecase.Authentication, l *slog.Logger) {

	g := router.Group("/v1")
	NewUserRouter(g, userUC, l)
	NewAuthRouter(g, authUC, l)
}
