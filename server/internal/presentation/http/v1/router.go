package v1

import (
	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/customerrors"

	"task-trail/internal/pkg/contextmanager"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	router *gin.Engine,
	cfg *config.Config,
	contextmanager *contextmanager.GinContextManager,
	errHandler customerrors.ErrorHandler,
	authMW gin.HandlerFunc,
	accessModule *access.AccessModule,
) {

	g := router.Group("/v1")
	NewAccessRouter(g, accessModule, authMW, errHandler, contextmanager, cfg)
}
