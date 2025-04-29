package v1

import (
	"log/slog"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

type authenticationRoutes struct {
	u usecase.Authentication
	l *slog.Logger
}

func NewAuthenticationRouter(router *gin.Engine, u usecase.Authentication, l *slog.Logger) {
	r := &authenticationRoutes{u: u, l: l}
	g := router.Group("/authentication")

	g.GET("/", r.authenticate)
}
