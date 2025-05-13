package middleware

import (
	"log/slog"
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

func RecoveryWithLogger(l logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				l.Error("panic recovered",
					slog.Any("error", r),
					slog.String("path", c.Request.URL.Path),
					slog.String("method", c.Request.Method),
					slog.String("client_ip", c.ClientIP()),
				)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
