package middleware

import (
	"task-trail/internal/application/service/access"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// NewAdmin lets only a service administrator through (ADR-0014): 403 if the user is not
// an administrator. Goes after NewAuth, which puts the user ID into the context.
func NewAdmin(check *access.AdminCheckService, m *contextmanager.GinContextManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := utils.Must(m.GetUserID(c))
		if err := check.Execute(c, userID); err != nil {
			_ = c.Error(err)
			c.Abort()
		}
	}
}
