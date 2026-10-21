package middleware

import (
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/pkg/contextmanager"

	"github.com/gin-gonic/gin"
)

// generate and add request id to request context
func NewRequest(uuidGenerator *id.UUIDGenerator, m *contextmanager.GinContextManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		m.SetRequestID(c, uuidGenerator.Generate())
		c.Next()
	}
}
