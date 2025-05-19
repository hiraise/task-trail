package v1

import (
	"task-trail/config"
	"task-trail/internal/customerrors"

	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	router *gin.Engine,
	cfg *config.Config,
	userUC usecase.User,
	authUC usecase.Authentication,
	contextmanager contextmanager.Gin,
	errHandler customerrors.ErrorHandler,

	authMW gin.HandlerFunc,
) {

	g := router.Group("/v1")
	NewUserRouter(g, userUC, authMW)
	NewAuthRouter(contextmanager, g, authUC, errHandler, cfg, authMW)
}
