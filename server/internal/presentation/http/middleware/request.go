package middleware

import (
	"task-trail/internal/pkg/contextmanager"

	"github.com/gin-gonic/gin"
)

// generate and add request id to request context
func NewRequest(m contextmanager.Gin) gin.HandlerFunc {
	return func(c *gin.Context) {
		m.SetRequestID(c)
		c.Next()
	}
}
