package v1

import (
	"task-trail/internal/application/service/access"
	"task-trail/internal/pkg/contextmanager"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	router *gin.Engine,
	cm *contextmanager.GinContextManager,
	authMW gin.HandlerFunc,
	accessModule *access.AccessModule,
) {
	g := router.Group("/v1")
	NewAuthRouter(g, accessModule, authMW, cm)
}
