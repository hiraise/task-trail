package v1

import (
	"task-trail/internal/usecase"
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

func NewRouter(router *gin.Engine, userUC usecase.User, authUC usecase.Authentication, l logger.Logger, authMW gin.HandlerFunc) {

	g := router.Group("/v1")
	NewUserRouter(g, userUC, l, authMW)
	NewAuthRouter(g, authUC, l)
}
