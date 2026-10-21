package middleware

import (
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"
	"time"

	"github.com/gin-gonic/gin"
)

// log each http event
func NewResponseLog(l logger.Logger, m *contextmanager.GinContextManager) gin.HandlerFunc {

	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		var userID *string = nil
		v, err := m.GetUserID(c)
		if err == nil {
			userID = &v
		}
		latency := time.Since(start)

		l.Info("http request",
			"status", c.Writer.Status(),
			"userID", userID,
			"reqID", m.GetRequestID(c),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"latency", latency.String(),
			"client", map[string]string{
				"ip":         c.ClientIP(),
				"user_agent": c.Request.UserAgent(),
			},
		)

	}
}
