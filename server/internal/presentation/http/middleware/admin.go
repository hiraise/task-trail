package middleware

import (
	"task-trail/internal/application/service/access"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// NewAdmin пускает дальше только администратора сервиса (ADR-0014): 403, если пользователь
// не администратор. Ставится после NewAuth — тот кладёт ID пользователя в контекст.
func NewAdmin(check *access.AdminCheckService, m *contextmanager.GinContextManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := utils.Must(m.GetUserID(c))
		if err := check.Execute(c, userID); err != nil {
			_ = c.Error(err)
			c.Abort()
		}
	}
}
