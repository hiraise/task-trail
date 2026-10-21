package http

import (
	"task-trail/internal/pkg/contextmanager"
	v1 "task-trail/internal/presentation/http/v1"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	app *gin.Engine,
	contextmanager *contextmanager.GinContextManager,
	authMW gin.HandlerFunc,
	adminMW gin.HandlerFunc,
	modules v1.Modules,
) {
	v1.NewRouter(app, contextmanager, authMW, modules)
	newDocsRouter(app, authMW, adminMW)
}
