package v1

import (
	"task-trail/internal/application/service/access"
	"task-trail/internal/application/service/file"
	"task-trail/internal/application/service/project"
	"task-trail/internal/application/service/user"
	"task-trail/internal/pkg/contextmanager"

	"github.com/gin-gonic/gin"
)

// Modules — модули сервера, чьи сценарии вызывают обработчики /v1.
type Modules struct {
	Access  *access.AccessModule
	User    *user.UserModule
	File    *file.FileModule
	Project *project.ProjectModule
}

func NewRouter(
	router *gin.Engine,
	cm *contextmanager.GinContextManager,
	authMW gin.HandlerFunc,
	modules Modules,
) {
	g := router.Group("/v1")
	NewAuthRouter(g, modules.Access, authMW, cm)
	NewUserRouter(g, modules.User, authMW, cm)
	NewFileRouter(g, modules.File)
	NewProjectRouter(g, modules.Project, authMW, cm)
}
