package middleware

import (
	"task-trail/internal/pkg/contextmanager"
	"task-trail/pkg/logger"
	"time"

	"github.com/gin-gonic/gin"
)

// log each http event
func NewLog(l logger.Logger, m contextmanager.Gin) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)
		status := c.Writer.Status()
		args := []any{
			"status", status,
			"userId", m.GetUserID(c),
			"reqId", m.GetRequestID(c),
			"client_ip", c.ClientIP(),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"user_agent", c.Request.UserAgent(),
			"latency", latency.String(),
		}

		l.Info("http request", args...)
	}
}
