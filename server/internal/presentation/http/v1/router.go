package v1

import (
	"task-trail/internal/application/service/access"
	"task-trail/internal/application/service/admin"
	"task-trail/internal/application/service/board"
	"task-trail/internal/application/service/file"
	"task-trail/internal/application/service/label"
	"task-trail/internal/application/service/notification"
	"task-trail/internal/application/service/project"
	"task-trail/internal/application/service/search"
	"task-trail/internal/application/service/task"
	"task-trail/internal/application/service/user"
	"task-trail/internal/pkg/contextmanager"

	"github.com/gin-gonic/gin"
)

// Modules are the server modules whose use cases the /v1 handlers call.
type Modules struct {
	Access  *access.AccessModule
	User    *user.UserModule
	File    *file.FileModule
	Project *project.ProjectModule
	Task    *task.TaskModule
	Board   *board.BoardModule
	Label   *label.LabelModule
	Search  *search.SearchModule
	Admin   *admin.AdminModule
	// Notification — the user's own notifications (ADR-0038).
	Notification *notification.NotificationModule
}

func NewRouter(
	router *gin.Engine,
	cm *contextmanager.GinContextManager,
	authMW gin.HandlerFunc,
	// optionalAuthMW signs in a request with a valid session and lets a guest through
	optionalAuthMW gin.HandlerFunc,
	adminMW gin.HandlerFunc,
	modules Modules,
) {
	g := router.Group("/v1")
	NewAuthRouter(g, modules.Access, authMW, cm)
	NewUserRouter(g, modules.User, authMW, cm)
	NewFileRouter(g, modules.File, optionalAuthMW, cm)
	NewProjectRouter(g, modules.Project, authMW, cm)
	NewTaskRouter(g, modules.Task, authMW, cm)
	NewBoardRouter(g, modules.Board, authMW, cm)
	NewLabelRouter(g, modules.Label, authMW, cm)
	NewSearchRouter(g, modules.Search, authMW, cm)
	NewAdminRouter(g, modules.Admin, modules.Access, authMW, adminMW, cm)
	NewNotificationRouter(g, modules.Notification, authMW, cm)
}
