package http

import (
	"task-trail/internal/application/service/access"
	"task-trail/internal/pkg/contextmanager"
	v1 "task-trail/internal/presentation/http/v1"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	app *gin.Engine,
	contextmanager *contextmanager.GinContextManager,
	authMW gin.HandlerFunc,
	adminMW gin.HandlerFunc,
	accessModule *access.AccessModule,
) {
	v1.NewRouter(app, contextmanager, authMW, accessModule)
	newDocsRouter(app, authMW, adminMW)
}
